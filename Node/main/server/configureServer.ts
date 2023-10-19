import https from 'https';
import { IncomingMessage, ServerResponse } from 'http';

import { serverLogger } from '../logging/loggers';
import { databaseQuery } from '../database/databaseQuery';
import { testDatabaseConnections } from '../database/testDatabaseConnection';
import { logServerError } from '../logging/logServerError';
import { restoreAlarmNotificationsForAllFamilies } from '../tools/notifications/alarm/restoreAlarmNotification';
import { SERVER } from './globalConstants';
import { HoundError } from './globalErrors';
import { getDatabaseConnections } from '../database/databaseConnections';

async function configureServer(server: https.Server<typeof IncomingMessage, typeof ServerResponse>): Promise<NodeJS.Timeout> {
  return new Promise((resolve) => {
    // We can only create an HTTPS server on the AWS instance. Otherwise we create a HTTP server.
    server.listen(SERVER.SERVER_PORT, async () => {
      serverLogger.info(`Running HTTPS server on port ${SERVER.SERVER_PORT}; ${SERVER.ENVIRONMENT} database`);

      await getDatabaseConnections();

      await restoreAlarmNotificationsForAllFamilies();

      // Invoke this interval every DATABASE_MAINTENANCE_INTERVAL, tests database connections and delete certain things
      const databaseMaintenanceIntervalObject = setInterval(async () => {
        serverLogger.info(`Performing ${SERVER.DATABASE_MAINTENANCE_INTERVAL / 1000} second maintenance`);

        const {
          databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
        } = await getDatabaseConnections();

        // Keep the latest DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES previousRequests, then delete any entries that are older
        databaseQuery(
          databaseConnectionForGeneral,
          `DELETE pr
          FROM previousRequests pr
          JOIN (SELECT requestId FROM previousRequests pr ORDER BY requestDate DESC LIMIT 1 OFFSET ?) prl ON pr.requestId < prl.requestId`,
          [SERVER.DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES],
        )
          .catch((error) => logServerError(
            new HoundError(
              'DELETE previousRequests',
              setInterval,
              undefined,
              error,
            ),
          ));

        // Keep the latest DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES previousResponses, then delete any entries that are older
        databaseQuery(
          databaseConnectionForGeneral,
          `DELETE pr
            FROM previousResponses pr
            JOIN (SELECT requestId FROM previousRequests pr ORDER BY requestDate DESC LIMIT 1 OFFSET ?) prl ON pr.requestId < prl.requestId`,
          [SERVER.DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES],
        )
          .catch((error) => logServerError(
            new HoundError(
              'DELETE previousResponses',
              setInterval,
              undefined,
              error,
            ),
          ));

        // Ensure that the database connections are valid and can query the database
        testDatabaseConnections(databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests)
          .catch((error) => logServerError(
            new HoundError(
              'testDatabaseConnections',
              setInterval,
              undefined,
              error,
            ),
          ));
      }, SERVER.DATABASE_MAINTENANCE_INTERVAL);

      resolve(databaseMaintenanceIntervalObject);
    });
  });
}

export { configureServer };
