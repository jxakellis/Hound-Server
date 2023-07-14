const { areAllDefined } = require('../format/validateDefined');
const { databaseQuery } = require('./databaseQuery');
const { serverLogger } = require('../logging/loggers');
const { formatArray } = require('../format/formatObject');

/// Performs basic query on user table to establish if the databaseConnection is valid
async function testDatabaseConnection(databaseConnection) {
  if (areAllDefined(databaseConnection) === false) {
    return;
  }

  await databaseQuery(
    databaseConnection,
    `SELECT 1
    FROM users u
    LIMIT 1`,
  );
  serverLogger.info(`databaseConnection with thread id ${databaseConnection.threadId} verified as connected`);
}

/// Performs basic query on user table to establish if all the databaseConnection are valid
async function testDatabaseConnections(...forDatabaseConnections) {
  serverLogger.info('Beginning tests for databaseConnections');
  const databaseConnections = formatArray(forDatabaseConnections);
  if (areAllDefined(databaseConnections) === false) {
    return;
  }

  const promises = [];
  // Iterate through all the databaseConnections
  for (let i = 0; i < databaseConnections.length; i += 1) {
    const databaseConnection = databaseConnections[i];
    promises.push(
      testDatabaseConnection(databaseConnection),
    );
  }

  await Promise.all(promises);
}

module.exports = {
  testDatabaseConnection, testDatabaseConnections,
};
