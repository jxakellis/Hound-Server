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

  responseLogger.debug(`Response for ${req.method} ${originalUrl}\n With body: ${JSON.stringify(responseBody)}`);

  if (areAllDefined(req.requestID) === true && areAllDefined(res.responseID) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        'INSERT INTO previousResponses(requestID, responseDate, responseBody) VALUES (?,?,?)',
        [req.requestID, date, responseBody],
      );
      const responseID = formatNumber(result.insertId);
      res.responseID = responseID;
    }
    catch (error) {
      logServerError('logResponse', error);
    }
  }
}

module.exports = { logResponse };
