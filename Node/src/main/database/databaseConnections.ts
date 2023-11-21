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
import { HoundError } from '../server/globalErrors.js';

import { serverLogger } from '../logging/loggers.js';
import { databaseQuery } from './databaseQuery.js';

// CREATE CONFIGURATION FOR DATABASE CONNECTIONS

const user = SERVER.IS_PRODUCTION_DATABASE ? productionHoundUser : developmentHoundUser;
const host = SERVER.IS_PRODUCTION_DATABASE ? productionHoundHost : developmentHoundHost;
const password = SERVER.IS_PRODUCTION_DATABASE ? productionHoundPassword : developmentHoundPassword;
const database = SERVER.IS_PRODUCTION_DATABASE ? productionHoundDatabase : developmentHoundDatabase;

// TODO FUTURE switch to namedPlaceholders. set the config option to true then modify databaseQuery to support it.

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
      connectionLimit: 10,
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
async function verifyDatabasePool(forDatabasePool: DatabasePools): Promise<void> {
  try {
    serverLogger.info(`verifyDatabasePool for ${forDatabasePool}`);

    const databaseConnection = await getPoolConnection(forDatabasePool);

    const { threadId } = databaseConnection;
    serverLogger.info(`Testing databaseConnection with threadId ${threadId}`);

    await databaseQuery(
      databaseConnection,
      `SELECT 1
      FROM users u
      LIMIT 1`,
    ).finally(() => {
      databaseConnection?.release();
    });

    serverLogger.info(`Successfully tested databaseConnection with threadId ${threadId}`);
  }
  catch (databaseConnectionError) {
    // Something failed, assume the pool is bad if it can't perform this simple task
    serverLogger.error(
      new HoundError(`Unable to getPoolConnection from ${forDatabasePool} and run an arbitrary databaseQuery`, verifyDatabasePool, undefined, databaseConnectionError).toJSON(),
    );

    // Recreate this bad pool
    try {
      // Destroy the old connections from the pool and assign the pool object to a new one
      switch (forDatabasePool) {
        case DatabasePools.general:
          databasePoolForGeneral.end();
          databasePoolForGeneral = await createDatabasePool();
          serverLogger.info(`Successfully re-created databasePoolForGeneral: ${databasePoolForGeneral}`);
          break;
        case DatabasePools.request:
          databasePoolForRequests.end();
          databasePoolForRequests = await createDatabasePool();
          serverLogger.info(`Successfully re-created databasePoolForRequests: ${databasePoolForRequests}`);
          break;
        default:
          // Nowhere to assign the new database pool, so end it
          break;
      }
    }
    catch (recreatePoolError) {
      serverLogger.error(new HoundError(`Unable to re-create the pool for ${forDatabasePool}`, verifyDatabasePool, undefined, recreatePoolError).toJSON());
    }

    return;
  }

  serverLogger.info(`Verified database pool ${forDatabasePool}`);
}

/**
For all of the DatabasePools, runs verifyDatabasePool. This attempt to acquire a connection from the pool and do an arbitrary query.
If this fails, that pool is ended and a new one is constructed
 */
async function verifyDatabasePools(): Promise<void> {
  await verifyDatabasePool(DatabasePools.general);
  await verifyDatabasePool(DatabasePools.request);
}

// Attempts to gracefully end all of the database pools
async function endDatabasePools(): Promise<void> {
  return new Promise((resolve) => {
    const numberOfEndsNeeded = 2;
    let numberOfEndsCompleted = 0;

    function checkForCompletion(): void {
      if (numberOfEndsCompleted === numberOfEndsNeeded) {
        serverLogger.info('Successfully ended all of the pools');
        resolve();
      }
    }

    databasePoolForGeneral.end((error) => {
      if (error !== undefined && error !== null) {
        serverLogger.error(new HoundError('Unable to end databasePoolForGeneral', endDatabasePools, undefined, error).toJSON());
      }
      else {
        serverLogger.info('Successfully ended databasePoolForGeneral');
      }

      numberOfEndsCompleted += 1;
      checkForCompletion();
    });

    databasePoolForRequests.end((error) => {
      if (error !== undefined && error !== null) {
        serverLogger.error(new HoundError('Unable to end databasePoolForRequests', endDatabasePools, undefined, error).toJSON());
      }
      else {
        serverLogger.info('Successfully ended databasePoolForRequests');
      }

      numberOfEndsCompleted += 1;
      checkForCompletion();
    });
  });
}

export {
  DatabasePools,
  getPoolConnection,
  verifyDatabasePools,
  endDatabasePools,
};
