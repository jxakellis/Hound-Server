import express from 'express';
const { responseLogger } from './loggers';
const { logServerError } from './logServerError';
const { databaseConnectionForLogging } from '../database/createDatabaseConnections';
const { databaseQuery } from '../database/databaseQuery';
const { areAllDefined } from '../validate/validateDefined';
const { formatString, formatNumber } from '../format/formatObject';

// Outputs response to the console and logs to database
async function logResponse(req: express.Request, res: express.Response, forStatus, forBody) {
  const originalUrl = formatString(req.originalUrl, 500);

  const responseStatus = formatNumber(forStatus);

  const responseBody = formatString(JSON.stringify(forBody), 500);

  responseLogger.debug(`Response for ${req.method} ${originalUrl}\n With body: ${JSON.stringify(responseBody)}`);

  if (areAllDefined(req.requestId) === true && areAllDefined(res.responseId) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        `INSERT INTO previousResponses
        (requestId, responseStatus, responseDate, responseBody)
        VALUES (?, ?, CURRENT_TIMESTAMP(), ?)`,
        [req.requestId, responseStatus, responseBody],
      );
      const responseId = formatNumber(result.insertId);
      res.responseId = responseId;
    }
    catch (error) {
      logServerError('logResponse', error);
    }
  }
}

export { logResponse };
