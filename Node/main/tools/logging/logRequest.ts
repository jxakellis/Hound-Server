import express from 'express';
import { requestLogger } from './loggers';
import { logServerError } from './logServerError';
import { databaseConnectionForLogging } from '../database/createDatabaseConnections';
import { databaseQuery } from '../database/databaseQuery';
import { areAllDefined } from '../validate/validateDefined';
import { formatString, formatNumber, formatSHA256Hash } from '../format/formatObject';
import { ValidationError } from '../general/errors';

// Outputs request to the console and logs to database
async function logRequest(req: express.Request, res: express.Response, next: NextFunction) {
  const ip = formatString(req.ip, 32);

  const method = formatString(req.method, 6);

  const originalUrl = formatString(req.originalUrl, 500);

  const body = formatString(JSON.stringify(req.body), 2000);

  requestLogger.debug(`Request for ${method} ${originalUrl}`);

  if (areAllDefined(method) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('method missing', global.CONSTANT.ERROR.VALUE.MISSING));
  }

  if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('method invalid', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // Inserts request information into the previousRequests table.
  if (areAllDefined(req.requestId) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        `INSERT INTO previousRequests
        (requestIP, requestDate, requestMethod, requestOriginalURL, requestBody)
        VALUES (?, CURRENT_TIMESTAMP(), ?, ?, ?)`,
        [ip, method, originalUrl, body],
      );
      const requestId = formatNumber(result.insertId);
      req.requestId = requestId;
    }
    catch (error) {
      logServerError('logRequest', error);
    }
  }

  return next();
}

async function addAppVersionToLogRequest(req: express.Request, res: express.Response, next: NextFunction) {
  const requestId = formatNumber(req.requestId);
  const appVersion = formatString(req.params.appVersion);

  // We are going to be modifying a pre-existing requestId and the appVersion should exist if this function is invoked
  if (areAllDefined(requestId, appVersion) === false) {
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

async function addUserIdToLogRequest(req: express.Request, res: express.Response, next: NextFunction) {
  const requestId = formatNumber(req.requestId);
  const userId = formatSHA256Hash(req.params.userId);

  // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
  if (areAllDefined(requestId, userId) === false) {
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

async function addFamilyIdToLogRequest(req: express.Request, res: express.Response, next: NextFunction) {
  const requestId = formatNumber(req.requestId);
  const familyId = formatSHA256Hash(req.params.familyId);

  // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
  if (areAllDefined(requestId, familyId) === false) {
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
