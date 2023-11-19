import https from 'https';
import { IncomingMessage, ServerResponse } from 'http';

import { serverLogger } from '../logging/loggers.js';
import { databaseQuery } from '../database/databaseQuery.js';
import { logServerError } from '../logging/logServerError.js';
import { restoreAlarmNotificationsForAllFamilies } from '../tools/notifications/alarm/restoreAlarmNotification.js';
import { SERVER } from './globalConstants.js';
import { HoundError } from './globalErrors.js';
import { DatabasePools, getPoolConnection, testDatabasePools } from '../database/databaseConnections.js';

async function configureServer(server: https.Server<typeof IncomingMessage, typeof ServerResponse>): Promise<NodeJS.Timeout> {
  return new Promise((resolve) => {
    // We can only create an HTTPS server on the AWS instance. Otherwise we create a HTTP server.
    server.listen(SERVER.SERVER_PORT, async () => {
      serverLogger.info(`Running HTTPS server on port ${SERVER.SERVER_PORT}; ${SERVER.ENVIRONMENT} database`);

      await restoreAlarmNotificationsForAllFamilies();

      // Invoke this interval every DATABASE_MAINTENANCE_INTERVAL, tests database connections and delete certain things
      const databaseMaintenanceIntervalObject = setInterval(async () => {
        serverLogger.info(`Performing ${SERVER.DATABASE_MAINTENANCE_INTERVAL / 1000} second maintenance`);

        await testDatabasePools();
        // We use two separate connections so that upon completion each connection can be released independently
        const deleteReqPoolConnection = await getPoolConnection(DatabasePools.general);
        const deleteResPoolConnection = await getPoolConnection(DatabasePools.general);

        // Keep the latest DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES previousRequests, then delete any entries that are older
        databaseQuery(
          deleteReqPoolConnection,
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
          )).finally(() => {
            deleteReqPoolConnection.release();
          });

        // Keep the latest DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES previousResponses, then delete any entries that are older
        databaseQuery(
          deleteResPoolConnection,
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
          )).finally(() => {
            deleteResPoolConnection.release();
          });
      }, SERVER.DATABASE_MAINTENANCE_INTERVAL);

      resolve(databaseMaintenanceIntervalObject);
    });
  });
}

export { configureServer };
