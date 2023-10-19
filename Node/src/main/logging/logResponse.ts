import express from 'express';
import { responseLogger } from './loggers';
import { logServerError } from './logServerError';
import { getDatabaseConnections } from '../database/databaseConnections';
import { type ResultSetHeader, databaseQuery } from '../database/databaseQuery';
import { formatUnknownString } from '../format/formatObject';
import { HoundError } from '../server/globalErrors';

// Outputs response to the console and logs to database
async function logResponse(req: express.Request, res: express.Response, responseStatus: number | undefined, forResponseBody: string | undefined): Promise<void> {
  const originalUrl = formatUnknownString(req.originalUrl, 500);

  const responseBody = formatUnknownString(forResponseBody, 500);

  responseLogger.debug(`Response for ${req.method} ${originalUrl}\n With body: ${JSON.stringify(responseBody)}`);

  if (req.houndDeclarationExtendedProperties.requestId === undefined || res.houndDeclarationExtendedProperties.responseId !== undefined) {
    return;
  }

  try {
    const { databaseConnectionForLogging } = await getDatabaseConnections();

    const result = await databaseQuery<ResultSetHeader>(
      databaseConnectionForLogging,
      `INSERT INTO previousResponses
      (
        requestId, 
        responseStatus, 
        responseDate, 
        responseBody
        )
        VALUES (
          ?, 
          ?, 
          CURRENT_TIMESTAMP(), 
          ?)`,
      [
        req.houndDeclarationExtendedProperties.requestId,
        responseStatus,
        // none, default value
        responseBody,
      ],
    );
    res.houndDeclarationExtendedProperties.responseId = result.insertId;
  }
  catch (error) {
    logServerError(
      new HoundError(
        'Was not able to insert previousResponse',
        logResponse,
        undefined,
        error,
      ),
    );
  }
}

export { logResponse };
