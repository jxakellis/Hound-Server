const { serverLogger } = require('../tools/logging/loggers');
const { configureDatabaseConnections } = require('../tools/database/configureDatabaseConnection');
const { databaseQuery } = require('../tools/database/databaseQuery');
const { testDatabaseConnections } = require('../tools/database/testDatabaseConnection');
const {
  databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
} = require('../tools/database/createDatabaseConnections');
const { logServerError } = require('../tools/logging/logServerError');
const { restoreAlarmNotificationsForAllFamilies } = require('../tools/notifications/alarm/restoreAlarmNotification');

const configureServerForRequests = (server) => new Promise((resolve) => {
// We can only create an HTTPS server on the AWS instance. Otherwise we create a HTTP server.
  server.listen(global.CONSTANT.SERVER.SERVER_PORT, async () => {
    serverLogger.info(`Running HTTPS server on port ${global.CONSTANT.SERVER.SERVER_PORT}; ${global.CONSTANT.SERVER.IS_PRODUCTION_DATABASE ? 'production' : 'development'} database`);

    await configureDatabaseConnections();

    await restoreAlarmNotificationsForAllFamilies();

    // Invoke this interval every DATABASE_MAINTENANCE_INTERVAL, tests database connections and delete certain things
    const databaseMaintenanceIntervalObject = setInterval(() => {
      serverLogger.info(`Performing ${global.CONSTANT.SERVER.DATABASE_MAINTENANCE_INTERVAL / 1000} second maintenance`);

      // Keep the latest DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES previousRequests, then delete any entries that are older
      databaseQuery(
        databaseConnectionForGeneral,
        `DELETE pr
        FROM previousRequests pr
        JOIN (SELECT requestId FROM previousRequests pr ORDER BY requestDate DESC LIMIT 1 OFFSET ?) prl ON pr.requestId < prl.requestId`,
        [global.CONSTANT.SERVER.DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES],
      )
        .catch((error) => logServerError('DELETE previousRequests for databaseMaintenanceIntervalObject', error));

      // Keep the latest DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES previousResponses, then delete any entries that are older
      databaseQuery(
        databaseConnectionForGeneral,
        `DELETE pr
        FROM previousResponses pr
        JOIN (SELECT requestId FROM previousRequests pr ORDER BY requestDate DESC LIMIT 1 OFFSET ?) prl ON pr.requestId < prl.requestId`,
        [global.CONSTANT.SERVER.DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES],
      )
        .catch((error) => logServerError('DELETE previousResponses for databaseMaintenanceIntervalObject', error));

      // Ensure that the database connections are valid and can query the database
      testDatabaseConnections(databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests)
        .catch((error) => logServerError('testDatabaseConnections for databaseMaintenanceIntervalObject', error));
    }, global.CONSTANT.SERVER.DATABASE_MAINTENANCE_INTERVAL);

    resolve(databaseMaintenanceIntervalObject);
  });
});

module.exports = { configureServerForRequests };
