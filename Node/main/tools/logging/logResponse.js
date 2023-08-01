const { responseLogger } = require('./loggers');
const { logServerError } = require('./logServerError');
const { databaseConnectionForLogging } = require('../database/createDatabaseConnections');
const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../validate/validateDefined');
const { formatString, formatNumber } = require('../format/formatObject');

// Outputs response to the console and logs to database
async function logResponse(req, res, body) {
  const originalUrl = formatString(req.originalUrl, 500);

  const responseBody = formatString(JSON.stringify(body), 500);

  responseLogger.debug(`Response for ${req.method} ${originalUrl}\n With body: ${JSON.stringify(responseBody)}`);

  if (areAllDefined(req.requestId) === true && areAllDefined(res.responseId) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        `INSERT INTO previousResponses
        (requestId, responseDate, responseBody)
        VALUES (?, CURRENT_TIMESTAMP(), ?)`,
        [req.requestId, responseBody],
      );
      const responseId = formatNumber(result.insertId);
      res.responseId = responseId;
    }
    catch (error) {
      logServerError('logResponse', error);
    }
  }
}

module.exports = { logResponse };
