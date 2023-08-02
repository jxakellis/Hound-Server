const { serverLogger } = require('./loggers');
const { databaseConnectionForLogging } = require('../database/createDatabaseConnections');
const { databaseQuery } = require('../database/databaseQuery');
const { formatString } = require('../format/formatObject');

// Outputs response to the console and logs to database
async function logServerError(forFunction, forError) {
  const errorFunction = formatString(forFunction, 100);

  const errorName = formatString(forError && forError.constructor && forError.constructor.name, 500);

  const errorMessage = formatString(forError && forError.message, 500);

  const errorCode = formatString(forError && forError.code, 500);

  // Attempt to get the .stack. If the stack is undefined, then we just simply get the error
  const errorStack = formatString((forError && forError.stack) || forError, 2500);

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

function printServerError(forFunction, forError) {
  const errorFunction = formatString(forFunction, 100);

  const errorName = formatString(forError && forError.constructor && forError.constructor.name, 500);

  const errorMessage = formatString(forError && forError.message, 500);

  const errorCode = formatString(forError && forError.code, 500);

  // Attempt to get the .stack. If the stack is undefined, then we just simply get the error
  const errorStack = formatString((forError && forError.stack) || forError, 2500);

  serverLogger.error(`UNCAUGHT '${errorName}' FROM FUNCTION: ${errorFunction}\n MESSAGE: ${errorMessage}\n CODE: ${errorCode}\n STACK: ${errorStack}`);
}

module.exports = { logServerError };
