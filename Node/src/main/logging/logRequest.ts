import express from 'express';
import { requestLogger } from './loggers.js';
import { logServerError } from './logServerError.js';
import { getDatabaseConnections } from '../database/databaseConnections.js';
import { type ResultSetHeader, databaseQuery } from '../database/databaseQuery.js';
import { formatUnknownString } from '../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../server/globalErrors.js';

// Outputs request to the console and logs to database
async function logRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const ip = formatUnknownString(req.ip, 32);

    const method = formatUnknownString(req.method, 6);

    const originalUrl = formatUnknownString(req.originalUrl, 500);

    const body = formatUnknownString(JSON.stringify(req.body), 2000);

    requestLogger.debug(`Request for ${method} ${originalUrl}`);

    if (method === undefined || method === null) {
      throw new HoundError('method missing', logRequest, ERROR_CODES.VALUE.MISSING);
    }

    if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
      throw new HoundError('method invalid', logRequest, ERROR_CODES.VALUE.INVALID);
    }

    if (originalUrl === undefined || originalUrl === null) {
      throw new HoundError('originalUrl missing', logRequest, ERROR_CODES.VALUE.MISSING);
    }

    // Inserts request information into the previousRequests table.
    if (req.houndDeclarationExtendedProperties.requestId !== undefined && req.houndDeclarationExtendedProperties.requestId !== null) {
      return next();
    }

    const { databaseConnectionForLogging } = await getDatabaseConnections();
    const result = await databaseQuery<ResultSetHeader>(
      databaseConnectionForLogging,
      `INSERT INTO previousRequests
        (
          requestIP,
          requestDate,
          requestMethod,
          requestOriginalURL,
          requestBody
          )
          VALUES 
          (
            ?,
            CURRENT_TIMESTAMP(), 
            ?, 
            ?, 
            ?
            )`,
      [
        ip,
        // none, default value
        method,
        originalUrl,
        body,
      ],
    );
    req.houndDeclarationExtendedProperties.requestId = result.insertId;
  }
  catch (error) {
    logServerError(
      new HoundError(
        'Was not able to insert previousRequest',
        logRequest,
        undefined,
        error,
      ),
    );
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function addAppVersionToLogRequest(requestId: number, appVersion: string): Promise<void> {
  try {
    const { databaseConnectionForLogging } = await getDatabaseConnections();

    await databaseQuery(
      databaseConnectionForLogging,
      `UPDATE previousRequests
                SET requestAppVersion = ?
                WHERE requestId = ?`,
      [appVersion, requestId],
    );
  }
  catch (error) {
    logServerError(
      new HoundError(
        'Was not able to update previousRequest with requestAppVersion',
        logRequest,
        undefined,
        error,
      ),
    );
  }
}

async function addUserIdToLogRequest(requestId: number, validatedUserId: string): Promise<void> {
  try {
    const { databaseConnectionForLogging } = await getDatabaseConnections();

    await databaseQuery(
      databaseConnectionForLogging,
      `UPDATE previousRequests
                      SET requestUserId = ?
                      WHERE requestId = ?`,
      [validatedUserId, requestId],
    );
  }
  catch (error) {
    logServerError(
      new HoundError(
        'Was not able to update previousRequest with requestUserId',
        logRequest,
        undefined,
        error,
      ),
    );
  }
}

async function addFamilyIdToLogRequest(requestId: number, validatedFamilyId: string): Promise<void> {
  try {
    /*
    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;

    // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
    if (requestId === undefined || requestId === null) {
      return next();
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      return next();
    }
    */

    const { databaseConnectionForLogging } = await getDatabaseConnections();

    await databaseQuery(
      databaseConnectionForLogging,
      `UPDATE previousRequests
                            SET requestFamilyId = ?
                            WHERE requestId = ?`,
      [validatedFamilyId, requestId],
    );
  }
  catch (error) {
    logServerError(
      new HoundError(
        'Was not able to update previousRequest with requestFamilyId',
        logRequest,
        undefined,
        error,
      ),
    );
  }
}

export {
  logRequest, addAppVersionToLogRequest, addUserIdToLogRequest, addFamilyIdToLogRequest,
};
