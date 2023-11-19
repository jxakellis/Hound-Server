import { serverLogger } from './loggers.js';
import { DatabasePools, getPoolConnection } from '../database/databaseConnections.js';
import { databaseQuery } from '../database/databaseQuery.js';
import { HoundError, convertErrorToJSON } from '../server/globalErrors.js';
import { formatKnownString } from '../format/formatObject.js';

function printServerError(houndError: HoundError): void {
  const readableError = convertErrorToJSON(houndError);

  serverLogger.error(
    `\nUNCAUGHT FROM SOURCE FUNCTIONS: ${readableError.sourceFunctions}
    \nMESSAGE: ${readableError.message}
    \nCODE: ${readableError.code}
    \nSTACK: ${readableError.stack}\n`,
  );
}

// Outputs response to the console and logs to database
async function logServerError(houndError: HoundError): Promise<void> {
  const readableError = convertErrorToJSON(houndError);

  printServerError(houndError);

  try {
    const generalPoolConnection = await getPoolConnection(DatabasePools.general);

    await databaseQuery(
      generalPoolConnection,
      `INSERT INTO previousServerErrors
      (
        errorDate,
        errorSourceFunctions, 
        errorName, 
        errorMessage, 
        errorCode, 
        errorStack
        )
        VALUES (
          CURRENT_TIMESTAMP(),
          ?,
          ?,
          ?,
          ?,
          ?
          )`,
      [
      // none, default value
        formatKnownString(readableError.sourceFunctions, 500),
        formatKnownString(readableError.name, 500),
        formatKnownString(readableError.message, 500),
        formatKnownString(readableError.code, 500),
        formatKnownString(readableError.stack, 2500),
      ],
    ).finally(() => {
      generalPoolConnection.release();
    });
  }
  catch (error) {
    printServerError(
      new HoundError(
        'logServerError could not insert error',
        logServerError,
        undefined,
        error,
      ),
    );
  }
}

export { logServerError };
