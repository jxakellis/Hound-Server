const { serverLogger } = require('../logging/loggers');
const {
  databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
} = require('./createDatabaseConnections');
const { testDatabaseConnections } = require('./testDatabaseConnection');
const { areAllDefined } = require('../format/validateDefined');
const { databaseQuery } = require('./databaseQuery');
const { formatArray } = require('../format/formatObject');

async function configureDatabaseConnections() {
  // First make sure all connetions are connected to the database
  const promises = [
    databaseConnectionForGeneral.promise().connect(),
    databaseConnectionForLogging.promise().connect(),
    databaseConnectionForAlarms.promise().connect(),
  ];

  await Promise.all(promises);

  // Test to make sure all connections (or pools) can access a basic table
  await testDatabaseConnections(databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests);

  // Once all databaseConnections verified, find the number of active threads to the MySQL server
  serverLogger.info(`Currently ${await findNumberOfThreadsConnectedToDatabase(databaseConnectionForGeneral)} threads connected to MariaDB Database Server`);

  await updateDatabaseConnectionsWaitTimeouts(databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests);
}

/// Uses an existing database databaseConnection to find the number of active databaseConnections to said database
async function findNumberOfThreadsConnectedToDatabase(databaseConnection) {
  if (areAllDefined(databaseConnection) === false) {
    return -1;
  }

  const [threadsConnected] = await databaseQuery(
    databaseConnection,
    'SHOW STATUS WHERE variable_name = ?',
    ['Threads_connected'],
  );

  if (areAllDefined(threadsConnected) === false) {
    return -1;
  }

  return threadsConnected.Value;
}

/// Takes an array of database databaseConnections and updates their wait_timeout so the databaseConnections can idle for that number of seconds (before being disconnected)
async function updateDatabaseConnectionsWaitTimeouts(...forDatabaseConnections) {
  const databaseConnections = formatArray(forDatabaseConnections);
  if (areAllDefined(databaseConnections) === false) {
    return;
  }

  const promises = [];
  // Iterate through all the databaseConnections
  for (let i = 0; i < databaseConnections.length; i += 1) {
    const databaseConnection = databaseConnections[i];
    // Aallow the databaseConnection to idle for DATABASE_CONNECTION_WAIT_TIMEOUT seconds before being killed
    promises.push(
      databaseQuery(
        databaseConnection,
        'SET session wait_timeout = ?',
        [(global.CONSTANT.SERVER.DATABASE_CONNECTION_WAIT_TIMEOUT)],
      ),
    );
  }

  await Promise.all(promises);
}

module.exports = { configureDatabaseConnections };
