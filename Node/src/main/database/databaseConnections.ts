import mysql2, { type PoolConnection } from 'mysql2';
import {
  developmentHoundUser,
  developmentHoundHost,
  developmentHoundPassword,
  developmentHoundDatabase,
  productionHoundUser,
  productionHoundHost,
  productionHoundPassword,
  productionHoundDatabase,
} from '../secrets/databaseConnection.js';

import { SERVER } from '../server/globalConstants.js';
import { HoundError, convertErrorToJSON } from '../server/globalErrors.js';

import { serverLogger } from '../logging/loggers.js';
import { databaseQuery } from './databaseQuery.js';

// CREATE CONFIGURATION FOR DATABASE CONNECTIONS

const user = SERVER.IS_PRODUCTION_DATABASE ? productionHoundUser : developmentHoundUser;
const host = SERVER.IS_PRODUCTION_DATABASE ? productionHoundHost : developmentHoundHost;
const password = SERVER.IS_PRODUCTION_DATABASE ? productionHoundPassword : developmentHoundPassword;
const database = SERVER.IS_PRODUCTION_DATABASE ? productionHoundDatabase : developmentHoundDatabase;

// CREATE DATABASE CONNECTIONS
async function createDatabasePool(): Promise<mysql2.Pool> {
  let databasePool: (mysql2.Pool | undefined);
  try {
    databasePool = mysql2.createPool({
      // Database username.
      user,
      // Host where the database is located.
      host,
      // Password for the database user.
      password,
      // Name of the database to connect to.
      database,
      // If true, the pool will queue requests when no connections are available. If false, errors are returned immediately.
      waitForConnections: true,
      // Maximum number of connection requests to queue (0 for no limit).
      queueLimit: 10,
      // The maximum number of databaseConnections to create at once.
      connectionLimit: 5,
      // Time in milliseconds before a connection attempt is abandoned.
      connectTimeout: 5000,
      // Enables handling of big numbers (larger than Number.MAX_SAFE_INTEGER).
      supportBigNumbers: true,
      // When dealing with big numbers, they are returned as strings.
      bigNumberStrings: false,
      // Forces date fields to be returned as strings rather than inflated into JavaScript dates.
      dateStrings: false,
    });

    // Allow the connections from the databasePool to idle for DATABASE_CONNECTION_WAIT_TIMEOUT seconds before being killed
    await databaseQuery(
      databasePool,
      'SET session wait_timeout = ?',
      [SERVER.DATABASE_CONNECTION_WAIT_TIMEOUT],
    );

    // Make sure the databasePool can reach an arbitrary database table
    await databaseQuery(
      databasePool,
      `SELECT 1
      FROM users u
      LIMIT 1`,
    );

    return databasePool;
  }
  catch (error) {
    // Make sure to clean up and end the newly created pool connection since it is unusable
    databasePool?.end();
    throw new HoundError('Unable to createDatabasePool', createDatabasePool, undefined, error);
  }
}

let databasePoolForGeneral: mysql2.Pool = await createDatabasePool();
let databasePoolForRequests: mysql2.Pool = await createDatabasePool();

enum DatabasePools {
  general,
  request,
}

async function getPoolConnection(forDatabasePool: DatabasePools): Promise<PoolConnection> {
  const databasePool = forDatabasePool === DatabasePools.request ? databasePoolForRequests : databasePoolForGeneral;
  return new Promise((resolve, reject) => {
    databasePool.getConnection(
      (error, connection) => {
        if (connection === undefined || connection === null) {
          // error when trying to do query to database
          reject(new HoundError(`Unable to get a pool connection for pool ${forDatabasePool}`, getPoolConnection, undefined, error));
        }
        else {
          // database queried successfully
          resolve(connection);
        }
      },
    );
  });
}

/**
 * For a given DatabasePools, attempts to acquire a pool connection from the pool and attempts to run an arbitrary query on the pool.
 * If this fails, the pool is ended and a new one is made.
 */
async function testDatabasePool(forDatabasePool: DatabasePools): Promise<void> {
  try {
    serverLogger.info(`testDatabasePool for ${forDatabasePool}`);

    const databaseConnection = await getPoolConnection(forDatabasePool);

    serverLogger.info(`Testing databaseConnection with threadId ${databaseConnection.threadId}`);

    await databaseQuery(
      databaseConnection,
      `SELECT 1
      FROM users u
      LIMIT 1`,
    ).finally(() => {
      databaseConnection?.release();
    });

    serverLogger.info('Successfully tested databaseConnection');
  }
  catch (databaseConnectionError) {
    // Something failed, assume the pool is bad if it can't perform this simple task
    serverLogger.error(
      convertErrorToJSON(
        new HoundError(`Unable to create a database connection from ${forDatabasePool} and run an arbitrary query`, testDatabasePool, undefined, databaseConnectionError),
      ),
    );

    // Recreate this bad pool
    try {
      // Destroy the old connections from the pool and assign the pool object to a new one
      switch (forDatabasePool) {
        case DatabasePools.general:
          databasePoolForGeneral.end();
          databasePoolForGeneral = await createDatabasePool();
          serverLogger.info(`Successfully created databasePoolForGeneral: ${databasePoolForGeneral}`);
          break;
        case DatabasePools.request:
          databasePoolForRequests.end();
          databasePoolForRequests = await createDatabasePool();
          serverLogger.info(`Successfully created databasePoolForRequests: ${databasePoolForRequests}`);
          break;
        default:
          // Nowhere to assign the new database pool, so end it
          break;
      }
    }
    catch (recreatePoolError) {
      serverLogger.error(convertErrorToJSON(new HoundError(`Unable to recreate the pool for ${forDatabasePool}`, testDatabasePool, undefined, recreatePoolError)));
    }

    return;
  }

  serverLogger.info(`Verified database pool ${forDatabasePool}`);
}

async function testDatabasePools(): Promise<void> {
  // TODO NOW, if testDatabasePool fully fails for either, make program throw a further exception to caught an uncaught error and cause it to crash, which pm2 will then restart
  await testDatabasePool(DatabasePools.general);
  await testDatabasePool(DatabasePools.request);
}

// Attempts to gracefully end all of the database pools
async function endDatabasePools(): Promise<void> {
  return new Promise((resolve) => {
    const numberOfEndsNeeded = 2;
    let numberOfEndsCompleted = 0;

    function checkForCompletion(): void {
      if (numberOfEndsCompleted === numberOfEndsNeeded) {
        serverLogger.info('Ended all of the database pools');
        resolve();
      }
    }

    databasePoolForGeneral.end((error) => {
      if (error !== undefined && error !== null) {
        serverLogger.info('databasePoolForGeneral failed to end', error);
      }
      else {
        serverLogger.info('databasePoolForGeneral successfully ended');
      }

      numberOfEndsCompleted += 1;
      checkForCompletion();
    });

    databasePoolForRequests.end((error) => {
      if (error !== undefined && error !== null) {
        serverLogger.info('databasePoolForRequests failed to end', error);
      }
      else {
        serverLogger.info('databasePoolForRequests successfully ended');
      }

      numberOfEndsCompleted += 1;
      checkForCompletion();
    });
  });
}

setInterval(async () => {
  console.log('\n\ntest maint');
  console.log(databasePoolForGeneral);
  console.log('\n');
  console.log(databasePoolForRequests);

  await testDatabasePools();
}, 10000);

setInterval(async () => {
  console.log('\n\n ending pools');
  databasePoolForGeneral?.end();
  databasePoolForRequests?.end();
}, 45000);

export {
  DatabasePools,
  getPoolConnection,
  testDatabasePools,
  endDatabasePools,
};
