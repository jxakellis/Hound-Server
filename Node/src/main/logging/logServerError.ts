import { serverLogger } from './loggers.js';
import { getDatabaseConnections } from '../database/databaseConnections.js';
import { databaseQuery } from '../database/databaseQuery.js';
import { HoundError, convertErrorToJSON } from '../server/globalErrors.js';
import { formatKnownString } from '../format/formatObject.js';

function printServerError(houndError: HoundError): void {
  const readableError = convertErrorToJSON(houndError);

  serverLogger.error(
    `UNCAUGHT '${readableError}' FROM SOURCE FUNCTION: ${readableError.sourceFunction}
    MESSAGE: ${readableError.message}
    CODE: ${readableError.code}
    STACK: ${readableError.stack}`,
  );
}

// Outputs response to the console and logs to database
async function logServerError(houndError: HoundError): Promise<void> {
  const readableError = convertErrorToJSON(houndError);

  printServerError(houndError);

  try {
    const { databaseConnectionForLogging } = await getDatabaseConnections();

    await databaseQuery(
      databaseConnectionForLogging,
      `INSERT INTO previousServerErrors
      (
        errorDate,
        errorFunction, 
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
        formatKnownString(readableError.sourceFunction, 100),
        formatKnownString(readableError.name, 500),
        formatKnownString(readableError.message, 500),
        formatKnownString(readableError.code, 500),
        formatKnownString(readableError.stack, 2500),
      ],
    );
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
