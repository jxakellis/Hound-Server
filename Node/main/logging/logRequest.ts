import express from 'express';
import { requestLogger } from './loggers';
import { logServerError } from './logServerError';
import { getDatabaseConnections } from '../database/databaseConnections';
import { ResultSetHeader, databaseQuery } from '../database/databaseQuery';
import { formatUnknownString, formatNumber } from '../format/formatObject';
import { HoundError, ERROR_CODES } from '../server/globalErrors';

// Outputs request to the console and logs to database
async function logRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const ip = formatUnknownString(req.ip, 32);

    const method = formatUnknownString(req.method, 6);

    const originalUrl = formatUnknownString(req.originalUrl, 500);

    const body = formatUnknownString(JSON.stringify(req.body), 2000);

    requestLogger.debug(`Request for ${method} ${originalUrl}`);

    if (method === undefined) {
      throw new HoundError('method missing', logRequest, ERROR_CODES.VALUE.MISSING);
    }

    if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
      throw new HoundError('method invalid', logRequest, ERROR_CODES.VALUE.INVALID);
    }

    if (originalUrl === undefined) {
      throw new HoundError('originalUrl missing', logRequest, ERROR_CODES.VALUE.MISSING);
    }

    // Inserts request information into the previousRequests table.
    if (req.houndDeclarationExtendedProperties.requestId !== undefined) {
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
      const requestId = result.insertId;
      req.houndDeclarationExtendedProperties.requestId = requestId;
    }
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

async function addAppVersionToLogRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);
    const appVersion = formatUnknownString(req.params['appVersion']);

    // We are going to be modifying a pre-existing requestId and the appVersion should exist if this function is invoked
    if (requestId === undefined || appVersion === undefined) {
      return next();
    }

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

  return next();
}

async function addUserIdToLogRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (requestId === undefined || validatedUserId === undefined) {
      return next();
    }

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

  return next();
}

async function addFamilyIdToLogRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;

    // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
    if (requestId === undefined || validatedFamilyId === undefined) {
      return next();
    }

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

  return next();
}

export {
  logRequest, addAppVersionToLogRequest, addUserIdToLogRequest, addFamilyIdToLogRequest,
};
