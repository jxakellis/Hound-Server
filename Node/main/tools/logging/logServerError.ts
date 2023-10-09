import { serverLogger } from './loggers';
import { databaseConnectionForLogging } from '../../database/createDatabaseConnections';
import { databaseQuery } from '../../database/databaseQuery';
import { formatUnknownString } from '../format/formatObject';
import { HoundError } from '../../server/globalErrors';

function printServerError(forFunction: string, forError: unknown): void {
  const errorFunction = formatUnknownString(forFunction, 100);

  let errorName: string | undefined = 'Unknown';
  let errorMessage: string | undefined = 'Unknown';
  let errorCode: string | undefined = 'Unknown';
  let errorStack: string | undefined = 'Unknown';

  if (forError instanceof HoundError) {
    errorName = formatUnknownString(forError.type, 500);
    errorMessage = formatUnknownString(forError.message, 500);
    errorCode = formatUnknownString(forError.code, 500);
    errorStack = formatUnknownString(forError.stack || forError, 2500);
  }
  else if (forError instanceof Error) {
    errorName = formatUnknownString(forError.constructor.name, 500);
    errorMessage = formatUnknownString(forError.message, 500);
    errorCode = formatUnknownString(forError.code, 500);
    errorStack = formatUnknownString(forError.stack || forError, 2500);
  }

  serverLogger.error(`UNCAUGHT '${errorName}' FROM FUNCTION: ${errorFunction}\n MESSAGE: ${errorMessage}\n CODE: ${errorCode}\n STACK: ${errorStack}`);
}

// Outputs response to the console and logs to database
async function logServerError(forFunction: string, forError: unknown): Promise<void> {
  const errorFunction = formatUnknownString(forFunction, 100);

  let errorName: string | undefined = 'Unknown';
  let errorMessage: string | undefined = 'Unknown';
  let errorCode: string | undefined = 'Unknown';
  let errorStack: string | undefined = 'Unknown';

  if (forError instanceof HoundError) {
    errorName = formatUnknownString(forError.type, 500);
    errorMessage = formatUnknownString(forError.message, 500);
    errorCode = formatUnknownString(forError.code, 500);
    errorStack = formatUnknownString(forError.stack || forError, 2500);
  }
  else if (forError instanceof Error) {
    errorName = formatUnknownString(forError.constructor.name, 500);
    errorMessage = formatUnknownString(forError.message, 500);
    errorCode = formatUnknownString(forError.code, 500);
    errorStack = formatUnknownString(forError.stack || forError, 2500);
  }

  printServerError(forFunction, forError);

  databaseQuery(
    databaseConnectionForLogging,
    `INSERT INTO previousServerErrors
    (errorDate, errorFunction, errorName, errorMessage, errorCode, errorStack)
    VALUES (CURRENT_TIMESTAMP(), ?, ?, ?, ?, ?)`,
    [errorFunction, errorName, errorMessage, errorCode, errorStack],
  ).catch(
    (error) => printServerError('logServerError', error),
  );
}

export { logServerError };
