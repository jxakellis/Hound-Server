import express from 'express';
import { requestLogger } from './loggers';
import { logServerError } from './logServerError';
import { databaseConnectionForLogging } from '../../database/createDatabaseConnections';
import { ResultSetHeader, databaseQuery } from '../../database/databaseQuery';
import { formatUnknownString, formatNumber, formatSHA256Hash } from '../format/formatObject';
import { HoundError, ErrorType } from '../../server/globalErrors';
import { ERROR } from '../../server/globalConstants';

// Outputs request to the console and logs to database
async function logRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const ip = formatUnknownString(req.ip, 32);

  const method = formatUnknownString(req.method, 6);

  const originalUrl = formatUnknownString(req.originalUrl, 500);

  const body = formatUnknownString(JSON.stringify(req.body), 2000);

  requestLogger.debug(`Request for ${method} ${originalUrl}`);

  if (method === undefined) {
    return res.sendResponseForStatusBodyError(400, null, new HoundError('method missing', ErrorType.Validation, ERROR.VALUE.MISSING));
  }

  if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
    return res.sendResponseForStatusBodyError(400, null, new HoundError('method invalid', ErrorType.Validation, ERROR.VALUE.INVALID));
  }

  if (originalUrl === undefined) {
    return res.sendResponseForStatusBodyError(400, null, new HoundError('originalUrl missing', ErrorType.Validation, ERROR.VALUE.MISSING));
  }

  // Inserts request information into the previousRequests table.
  if (req.requestId !== undefined) {
    try {
      const result = await databaseQuery<ResultSetHeader>(
        databaseConnectionForLogging,
        `INSERT INTO previousRequests
        (requestIP, requestDate, requestMethod, requestOriginalURL, requestBody)
        VALUES (?, CURRENT_TIMESTAMP(), ?, ?, ?)`,
        [ip, method, originalUrl, body],
      );
      const requestId = result.insertId;
      req.requestId = requestId;
    }
    catch (error) {
      logServerError('logRequest', error);
    }
  }

  return next();
}

async function addAppVersionToLogRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const requestId = formatNumber(req.requestId);
  const appVersion = formatUnknownString(req.params['appVersion']);

  // We are going to be modifying a pre-existing requestId and the appVersion should exist if this function is invoked
  if (requestId === undefined || appVersion === undefined) {
    return next();
  }

  try {
    await databaseQuery(
      databaseConnectionForLogging,
      `UPDATE previousRequests
      SET requestAppVersion = ?
      WHERE requestId = ?`,
      [appVersion, requestId],
    );
  }
  catch (error) {
    logServerError('logRequest', error);
  }

  return next();
}

async function addUserIdToLogRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const requestId = formatNumber(req.requestId);
  const userId = formatSHA256Hash(req.params['userId']);

  // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
  if (requestId === undefined || userId === undefined) {
    return next();
  }

  try {
    await databaseQuery(
      databaseConnectionForLogging,
      `UPDATE previousRequests
      SET requestUserId = ?
      WHERE requestId = ?`,
      [userId, requestId],
    );
  }
  catch (error) {
    logServerError('logRequest', error);
  }

  return next();
}

async function addFamilyIdToLogRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const requestId = formatNumber(req.requestId);
  const familyId = formatSHA256Hash(req.params['familyId']);

  // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
  if (requestId === undefined || familyId === undefined) {
    return next();
  }

  try {
    await databaseQuery(
      databaseConnectionForLogging,
      `UPDATE previousRequests
      SET requestFamilyId = ?
      WHERE requestId = ?`,
      [familyId, requestId],
    );
  }
  catch (error) {
    logServerError('logRequest', error);
  }

  return next();
}

export {
  logRequest, addAppVersionToLogRequest, addUserIdToLogRequest, addFamilyIdToLogRequest,
};
