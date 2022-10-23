const { responseLogger } = require('./loggers');
const { logServerError } = require('./logServerError');
const { databaseConnectionForLogging } = require('../database/createDatabaseConnections');
const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../format/validateDefined');
const { formatString, formatNumber } = require('../format/formatObject');

// Outputs response to the console and logs to database
async function logResponse(req, res, body) {
  const date = new Date();

  const originalUrl = formatString(req.originalUrl, 500);

  const responseBody = formatString(JSON.stringify(body), 500);

  responseLogger.info(`Response for ${req.method} ${originalUrl}\n With body: ${JSON.stringify(responseBody)}`);

  if (areAllDefined(res.responseId) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        'INSERT INTO previousResponses(requestId, responseDate, responseBody) VALUES (?,?,?)',
        [req.requestId, date, responseBody],
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
