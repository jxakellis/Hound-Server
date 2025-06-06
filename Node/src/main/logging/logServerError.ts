import { serverLogger } from './loggers.js';
import { DatabasePools, getPoolConnection } from '../database/databaseConnections.js';
import { databaseQuery } from '../database/databaseQuery.js';
import { HoundError } from '../server/globalErrors.js';
import { formatKnownString, formatUnknownString } from '../format/formatObject.js';

function printServerError(houndError: HoundError): void {
  const readableError = houndError.toJSON();

  serverLogger.error(
    `\nPRINT SERVER ERROR FROM SOURCE FUNCTIONS: ${readableError.sourceFunctions}
    \nMESSAGE: ${readableError.message}
    \nCODE: ${readableError.code}
    \nSTACK: ${readableError.stack}
    \nDEBUG INFO: ${readableError.debugInfo}\n`,
  );
}

// Outputs response to the console and logs to database
async function logServerError(houndError: HoundError): Promise<void> {
  const readableError = houndError.toJSON();

  printServerError(houndError);

  try {
    // This pool connection is obtained manually here. Therefore we must also release it manually.
    // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
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
        errorStack,
        errorDebugInfo
        )
        VALUES (
          CURRENT_TIMESTAMP(),
          ?,
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
        formatUnknownString(readableError.debugInfo, 2500),
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
