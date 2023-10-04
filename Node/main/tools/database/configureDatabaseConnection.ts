import { serverLogger } from '../logging/loggers';
import {
  databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
} from './createDatabaseConnections';
import { testDatabaseConnection } from './testDatabaseConnection';
import { Queryable, databaseQuery } from './databaseQuery';
import { SERVER } from '../../server/globalConstants';
import { StatusResult } from '../types/StatusResult';

/// Uses an existing database databaseConnection to find the number of active databaseConnections to said database
async function findNumberOfThreadsConnectedToDatabase(databaseConnection: Queryable): Promise<number> {
  const [threadsConnected] = await databaseQuery<StatusResult>(
    databaseConnection,
    `SHOW STATUS
    WHERE variable_name = ?`,
    ['Threads_connected'],
  );

  if (threadsConnected === undefined) {
    return -1;
  }

  return parseInt(threadsConnected.Value, 10);
}

/// Takes an array of database databaseConnections and updates their wait_timeout so the databaseConnections can idle for that number of seconds (before being disconnected)
async function updateDatabaseConnectionsWaitTimeouts(...databaseConnections: Queryable[]): Promise<void> {
  const promises = [];
  // Iterate through all the databaseConnections
  for (let i = 0; i < databaseConnections.length; i += 1) {
    const databaseConnection = databaseConnections[i];
    // Aallow the databaseConnection to idle for DATABASE_CONNECTION_WAIT_TIMEOUT seconds before being killed
    promises.push(
      databaseQuery(
        databaseConnection,
        'SET session wait_timeout = ?',
        [(SERVER.DATABASE_CONNECTION_WAIT_TIMEOUT)],
      ),
    );
  }

  await Promise.all(promises);
}

async function configureDatabaseConnections(): Promise<void> {
  // First make sure all connetions are connected to the database
  const promises = [
    databaseConnectionForGeneral.promise().connect(),
    databaseConnectionForLogging.promise().connect(),
    databaseConnectionForAlarms.promise().connect(),
  ];

  await Promise.all(promises);

  // Test to make sure all connections (or pools) can access a basic table
  await testDatabaseConnection(databaseConnectionForGeneral);
  await testDatabaseConnection(databaseConnectionForLogging);
  await testDatabaseConnection(databaseConnectionForAlarms);
  await testDatabaseConnection(databaseConnectionPoolForRequests);

  // Once all databaseConnections verified, find the number of active threads to the MySQL server
  serverLogger.info(`Currently ${await findNumberOfThreadsConnectedToDatabase(databaseConnectionForGeneral)} threads connected to MariaDB Database Server`);

  await updateDatabaseConnectionsWaitTimeouts(databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests);
}

export { configureDatabaseConnections };
