const { requestLogger } = require('./loggers');
const { logServerError } = require('./logServerError');
const { databaseConnectionForLogging } = require('../database/createDatabaseConnections');
const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../format/validateDefined');
const { formatString, formatNumber } = require('../format/formatObject');

// Outputs request to the console and logs to database
async function logRequest(req, res, next) {
  const date = new Date();

  const ip = formatString(req.ip, 32);

  const method = formatString(req.method, 6);

  const originalUrl = formatString(req.originalUrl, 500);

  requestLogger.info(`Request for ${method} ${originalUrl}`);

  // Inserts request information into the previousRequests table.
  if (areAllDefined(req.requestId) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        'INSERT INTO previousRequests(requestIP, requestDate, requestMethod, requestOriginalURL) VALUES (?,?,?,?)',
        [ip, date, method, originalUrl],
      );
      const requestId = formatNumber(result.insertId);
      req.requestId = requestId;
    }
    catch (error) {
      logServerError('logRequest', error);
    }
  }

  next();
}

module.exports = { logRequest };
