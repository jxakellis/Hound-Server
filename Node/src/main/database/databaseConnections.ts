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
import { testDatabaseConnections } from './testDatabaseConnection.js';
import { type Queryable, databaseQuery } from './databaseQuery.js';
import { type StatusResultRow } from '../types/StatusResultRow.js';

// CREATE CONFIGURATION FOR DATABSE CONNECTIONS

const user = SERVER.IS_PRODUCTION_DATABASE ? productionHoundUser : developmentHoundUser;
const host = SERVER.IS_PRODUCTION_DATABASE ? productionHoundHost : developmentHoundHost;
const password = SERVER.IS_PRODUCTION_DATABASE ? productionHoundPassword : developmentHoundPassword;
const database = SERVER.IS_PRODUCTION_DATABASE ? productionHoundDatabase : developmentHoundDatabase;
const connectTimeout = 30000;
const databaseConnectionConfiguration: mysql2.ConnectionOptions = {
  user,
  host,
  password,
  database,
  connectTimeout,
  supportBigNumbers: true,
  bigNumberStrings: false,
  dateStrings: false,
};

// CREATE DATABSE CONNECTIONS

const databaseConnectionForGeneral = mysql2.createConnection(databaseConnectionConfiguration);
const databaseConnectionForLogging = mysql2.createConnection(databaseConnectionConfiguration);
const databaseConnectionForAlarms = mysql2.createConnection(databaseConnectionConfiguration);
const databaseConnectionPoolForRequests = mysql2.createPool({
  user,
  host,
  password,
  database,
  // Determines the pool's action when no databaseConnections are available and the limit has been reached.
  // If true, the pool will queue the databaseConnection request and call it when one becomes available.
  // If false, the pool will immediately call back with an error.
  waitForConnections: true,
  // The maximum number of databaseConnection requests the pool will queue before returning an error from getConnection.
  // If set to 0, there is no limit to the number of queued databaseConnection requests.
  queueLimit: 0,
  // The maximum number of databaseConnections to create at once.
  connectionLimit: 10,
  connectTimeout: 10000,
});

async function getPoolConnection(): Promise<PoolConnection> {
  return new Promise((resolve, reject) => {
    databaseConnectionPoolForRequests.getConnection(
      (error, connection) => {
        console.log('getPoolConnection');
        console.log(error);
        console.log(connection);
        if (error !== undefined || connection === undefined) {
          // error when trying to do query to database
          reject(new HoundError(undefined, getPoolConnection, undefined, error));
        }
        else {
          // database queried successfully
          resolve(connection);
        }
      },
    );
  });
}

/// Uses an existing database databaseConnection to find the number of active databaseConnections to said database
async function findNumberOfThreadsConnectedToDatabase(databaseConnection: Queryable): Promise<number | undefined> {
  const result = await databaseQuery<StatusResultRow[]>(
    databaseConnection,
    `SHOW STATUS
    WHERE variable_name = ?`,
    ['Threads_connected'],
  );

  const threadsConnected = result.safeIndex(0);

  if (threadsConnected === undefined) {
    return undefined;
  }

  return parseInt(threadsConnected.Value, 10);
}

let hasConfiguredDatabaseConnection = false;

/**
 * If the database connections have not been configured yet, configures them then returns the databaseConnections.
 * If the databse connections have been configured, returns the databaseConnections immediately
 */
async function getDatabaseConnections(): Promise<{
  databaseConnectionForGeneral: mysql2.Connection
  databaseConnectionForLogging: mysql2.Connection
  databaseConnectionForAlarms: mysql2.Connection
  databaseConnectionPoolForRequests: mysql2.Pool
  getPoolConnection: () => Promise<PoolConnection>
}> {
  if (hasConfiguredDatabaseConnection === true) {
    return {
      databaseConnectionForGeneral,
      databaseConnectionForLogging,
      databaseConnectionForAlarms,
      databaseConnectionPoolForRequests,
      getPoolConnection,
    };
  }

  // First make sure all connetions are connected to the database
  const connectPromises = [
    databaseConnectionForGeneral.promise().connect(),
    databaseConnectionForLogging.promise().connect(),
    databaseConnectionForAlarms.promise().connect(),
  ];

  await Promise.all(connectPromises);

  const databaseConnections = [databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests];

  // TEST CONNECTIONS (make sure they are function)
  await testDatabaseConnections(...databaseConnections);

  // Once all databaseConnections verified, find the number of active threads to the MySQL server
  serverLogger.info(`Currently ${await findNumberOfThreadsConnectedToDatabase(databaseConnectionForGeneral)} threads connected to MariaDB Database Server`);

  // UPDATE CONNECTIONS (make sure they don't timeout when sitting idle)

  const waitTimeoutPromises: Promise<void>[] = [];

  databaseConnections.forEach((databaseConnection) => {
    // Aallow the databaseConnection to idle for DATABASE_CONNECTION_WAIT_TIMEOUT seconds before being killed
    waitTimeoutPromises.push(
      databaseQuery(
        databaseConnection,
        'SET session wait_timeout = ?',
        [SERVER.DATABASE_CONNECTION_WAIT_TIMEOUT],
      ),
    );
  });

  await Promise.all(waitTimeoutPromises);

  hasConfiguredDatabaseConnection = true;

  return {
    databaseConnectionForGeneral,
    databaseConnectionForLogging,
    databaseConnectionForAlarms,
    databaseConnectionPoolForRequests,
    getPoolConnection,
  };
}

export {
  getDatabaseConnections,
};
