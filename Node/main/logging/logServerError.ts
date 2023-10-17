import { serverLogger } from './loggers';
import { databaseConnectionForLogging } from '../database/createDatabaseConnections';
import { databaseQuery } from '../database/databaseQuery';
import { HoundError, convertErrorToJSON } from '../server/globalErrors';

function printServerError(houndError: HoundError): void {
  const readableError = convertErrorToJSON(houndError);

  serverLogger.error(
    `UNCAUGHT '${readableError.name}' FROM SOURCE FUNCTION: ${readableError.sourceFunction}
  MESSAGE: ${readableError.message}
  CODE: ${readableError.code}
  STACK: ${readableError.stack}`,
  );
}

// Outputs response to the console and logs to database
async function logServerError(houndError: HoundError): Promise<void> {
  const readableError = convertErrorToJSON(houndError);

  printServerError(houndError);

  databaseQuery(
    databaseConnectionForLogging,
    `INSERT INTO previousServerErrors
    (
      errorDate,
      errorFunction, 
      errorName, 
      errorMessage, 
      errorCode, 
      errorStack)
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
      readableError.sourceFunction,
      readableError.name,
      readableError.message,
      readableError.code,
      readableError.stack,
    ],
  ).catch(
    (error) => printServerError('logServerError', error),
  );
}

export { logServerError };
