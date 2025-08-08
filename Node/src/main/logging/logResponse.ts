import express from 'express';
import { responseLogger } from './loggers.js';
import { logServerError } from './logServerError.js';
import { DatabasePools, getPoolConnection } from '../database/databaseConnections.js';
import { type ResultSetHeader, databaseQuery } from '../database/databaseQuery.js';
import { formatUnknownString } from '../format/formatObject.js';
import { HoundError } from '../server/globalErrors.js';

// Outputs response to the console and logs to database
async function logResponse(req: express.Request, res: express.Response, responseStatus: number | undefined, forResponseBody: string | undefined): Promise<void> {
  const originalUrl = formatUnknownString(req.originalUrl, 500);

  const responseBody = formatUnknownString(forResponseBody, 500);

  responseLogger.debug(`Response for ${req.method} at ${originalUrl} with body ${responseBody}`);

  if (req.houndProperties.requestId === undefined || req.houndProperties.requestId === null) {
    return;
  }
  if (res.houndProperties.responseId !== undefined && res.houndProperties.responseId !== null) {
    return;
  }

  try {
    // This pool connection is obtained manually here. Therefore we must also release it manually.
    // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
    const generalPoolConnection = await getPoolConnection(DatabasePools.general);

    const result = await databaseQuery<ResultSetHeader>(
      generalPoolConnection,
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
        req.houndProperties.requestId,
        responseStatus,
        // none, default value
        responseBody,
      ],
    ).finally(() => {
      generalPoolConnection.release();
    });
    res.houndProperties.responseId = result.insertId;
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
