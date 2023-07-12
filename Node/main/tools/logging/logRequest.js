const { requestLogger } = require('./loggers');
const { logServerError } = require('./logServerError');
const { databaseConnectionForLogging } = require('../database/createDatabaseConnections');
const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../format/validateDefined');
const { formatString, formatNumber, formatSHA256Hash } = require('../format/formatObject');
const { ValidationError } = require('../general/errors');

// Outputs request to the console and logs to database
async function logRequest(req, res, next) {
  const date = new Date();

  const ip = formatString(req.ip, 32);

  const method = formatString(req.method, 6);

  const originalUrl = formatString(req.originalUrl, 500);

  const body = formatString(JSON.stringify(req.body), 2000);

  requestLogger.debug(`Request for ${method} ${originalUrl}`);

  if (areAllDefined(method) === false) {
    return res.sendResponseForStatusBodyError(400, undefined, new ValidationError('method missing', global.CONSTANT.ERROR.VALUE.MISSING));
  }

  if (method !== 'GET' && method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
    return res.sendResponseForStatusBodyError(400, undefined, new ValidationError('method invalid', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // Inserts request information into the previousRequests table.
  if (areAllDefined(req.requestId) === false) {
    try {
      const result = await databaseQuery(
        databaseConnectionForLogging,
        'INSERT INTO previousRequests(requestIP, requestDate, requestMethod, requestOriginalURL, requestBody) VALUES (?,?,?,?,?)',
        [ip, date, method, originalUrl, body],
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

async function addUserIdToLogRequest(req, res, next) {
  const requestId = formatNumber(req.requestId);
  const userId = formatSHA256Hash(req.params.userId);

  // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
  if (areAllDefined(requestId, userId) === false) {
    return next();
  }

  try {
    await databaseQuery(
      databaseConnectionForLogging,
      'UPDATE previousRequests SET requestUserId = ? WHERE requestId = ?',
      [userId, requestId],
    );
  }
  catch (error) {
    logServerError('logRequest', error);
  }

  return next();
}

async function addFamilyIdToLogRequest(req, res, next) {
  const requestId = formatNumber(req.requestId);
  const familyId = formatSHA256Hash(req.params.familyId);

  // We are going to be modifying a pre-existing requestId and the userId should exist if this function is invoked
  if (areAllDefined(requestId, familyId) === false) {
    return next();
  }

  try {
    await databaseQuery(
      databaseConnectionForLogging,
      'UPDATE previousRequests SET requestFamilyId = ? WHERE requestId = ?',
      [usefamilyIdrId, requestId],
    );
  }
  catch (error) {
    logServerError('logRequest', error);
  }

  return next();
}

module.exports = { logRequest, addUserIdToLogRequest, addFamilyIdToLogRequest };
