import express from 'express';
import { responseLogger } from './loggers';
import { logServerError } from './logServerError';
import { databaseConnectionForLogging } from '../../database/createDatabaseConnections';
import { ResultSetHeader, databaseQuery } from '../../database/databaseQuery';
import { formatUnknownString } from '../format/formatObject';

// Outputs response to the console and logs to database
async function logResponse(req: express.Request, res: express.Response, responseStatus: number | undefined, forResponseBody: string | undefined): Promise<void> {
  const originalUrl = formatUnknownString(req.originalUrl, 500);

  const responseBody = formatUnknownString(forResponseBody, 500);

  responseLogger.debug(`Response for ${req.method} ${originalUrl}\n With body: ${JSON.stringify(responseBody)}`);

  if (req.requestId === undefined || res.responseId !== undefined) {
    return;
  }

  try {
    const result = await databaseQuery<ResultSetHeader>(
      databaseConnectionForLogging,
      `INSERT INTO previousResponses
      (requestId, responseStatus, responseDate, responseBody)
      VALUES (?, ?, CURRENT_TIMESTAMP(), ?)`,
      [req.requestId, responseStatus, responseBody],
    );
    res.responseId = result.insertId;
  }
  catch (error) {
    logServerError('logResponse', error);
  }
}

export { logResponse };
