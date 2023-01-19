const { DatabaseError } = require('./errors');
const { logResponse } = require('../logging/logResponse');
const { logServerError } = require('../logging/logServerError');
const { formatNumber, formatBoolean } = require('../format/formatObject');
const { convertErrorToJSON } = require('./errors');
const { areAllDefined } = require('../format/validateDefined');
const { databaseQuery } = require('../database/databaseQuery');
const { databaseConnectionPoolForRequests } = require('../database/createDatabaseConnections');

async function configureRequestForResponse(req, res, next) {
  res.hasSentResponse = false;
  req.hasActiveDatabaseConnection = false;
  req.hasActiveDatabaseTransaction = false;
  req.requestId = undefined;
  res.responseId = undefined;
  configureResponse(req, res);

  const hasActiveDatabaseConnection = formatBoolean(req.hasActiveDatabaseConnection);
  const hasActiveDatabaseTransaction = formatBoolean(req.hasActiveDatabaseTransaction);

  if (hasActiveDatabaseConnection === true || hasActiveDatabaseTransaction === true) {
    return next();
  }

  try {
    const requestPoolConnection = await databaseConnectionPoolForRequests.promise().getConnection();
    req.hasActiveDatabaseConnection = true;
    try {
      await requestPoolConnection.beginTransaction();
      req.databaseConnection = requestPoolConnection.connection;
      req.hasActiveDatabaseTransaction = true;
    }
    catch (transactionError) {
      return res.sendResponseForStatusJSONError(500, undefined, new DatabaseError("Couldn't begin a transaction with databaseConnection", global.CONSTANT.ERROR.GENERAL.POOL_TRANSACTION_FAILED));
    }
  }
  catch (databaseConnectionError) {
    return res.sendResponseForStatusJSONError(
      500,
      undefined,
      new DatabaseError("Couldn't get a connection from databaseConnectionPoolForRequests", global.CONSTANT.ERROR.GENERAL.POOL_CONNECTION_FAILED),
    );
  }

  return next();
}

function configureResponse(req, res) {
  res.sendResponseForStatusJSONError = async function sendResponseForStatusJSONError(forStatus, json, error) {
    const hasSentResponse = formatBoolean(res.hasSentResponse);
    const hasActiveDatabaseConnection = formatBoolean(req.hasActiveDatabaseConnection);
    const hasActiveDatabaseTransaction = formatBoolean(req.hasActiveDatabaseTransaction);
    const status = formatNumber(forStatus);

    // Check to see if the request has an active databaseConnection
    // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
    if (hasActiveDatabaseConnection === true) {
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (hasActiveDatabaseTransaction === false) {
        releaseDatabaseConnection(req, req.databaseConnection, hasActiveDatabaseConnection);
      }
      else if (status >= 200 && status <= 299) {
        // attempt to commit transaction
        await commitTransaction(req, req.databaseConnection, hasActiveDatabaseConnection, hasActiveDatabaseTransaction);
      }
      else {
        // attempt to rollback transaction
        await rollbackTransaction(req, req.databaseConnection, hasActiveDatabaseConnection, hasActiveDatabaseTransaction);
      }
    }

    // Check to see if a response has been sent yet
    if (areAllDefined(hasSentResponse) === false || hasSentResponse === true) {
      return;
    }

    const socketDestroyed = formatBoolean(res && res.socket && res.socket.destroyed);

    if (areAllDefined(socketDestroyed) === false || socketDestroyed === true) {
      return;
    }

    // If we user provided an error, then we convert that error to JSON and use it as the body
    const body = areAllDefined(error)
      ? convertErrorToJSON(error)
      : json;

    await logResponse(req, res, body);

    res.hasSentResponse = true;
    res.status(status).json(body);
  };
}

async function commitTransaction(req, databaseConnection, forHasActiveDatabaseConnection, forHasActiveDatabaseTransaction) {
  const hasActiveConnection = formatBoolean(forHasActiveDatabaseConnection);
  const hasActiveTransaction = formatBoolean(forHasActiveDatabaseTransaction);
  if (areAllDefined(req, databaseConnection, hasActiveConnection, hasActiveTransaction) === false) {
    return;
  }

  if (hasActiveConnection === false) {
    return;
  }

  if (hasActiveTransaction === true) {
    try {
      // Attempt to COMMIT the transaction
      await databaseQuery(databaseConnection, 'COMMIT');
      req.hasActiveDatabaseTransaction = false;
    }
    catch (commitError) {
      // COMMIT failed, attempt to rollback
      logServerError('commitTransaction COMMIT', commitError);
      try {
        await databaseQuery(databaseConnection, 'ROLLBACK');
        req.hasActiveDatabaseTransaction = false;
        // Backup Rollback succeeded
      }
      catch (rollbackError) {
        // Backup ROLLBACK failed, skip COMMIT and ROLLBACK since both failed
        logServerError('commitTransaction ROLLBACK', rollbackError);
      }
    }
  }

  releaseDatabaseConnection(req, databaseConnection, hasActiveConnection);
}

async function rollbackTransaction(req, databaseConnection, hasActiveDatabaseConnection, hasActiveDatabaseTransaction) {
  const hasActiveConnection = formatBoolean(hasActiveDatabaseConnection);
  const hasActiveTransaction = formatBoolean(hasActiveDatabaseTransaction);
  if (areAllDefined(req, databaseConnection, hasActiveConnection, hasActiveTransaction) === false) {
    return;
  }

  if (hasActiveConnection === false) {
    return;
  }

  if (hasActiveTransaction === true) {
    try {
      await databaseQuery(databaseConnection, 'ROLLBACK');
      req.hasActiveDatabaseTransaction = false;
    }
    catch (rollbackError) {
      // ROLLBACK failed, continue as there is nothing we can do
      logServerError('rollbackTransaction ROLLBACK', rollbackError);
    }
  }

  releaseDatabaseConnection(req, databaseConnection, hasActiveConnection);
}

function releaseDatabaseConnection(req, databaseConnection, hasActiveDatabaseConnection) {
  const hasActiveConnection = formatBoolean(hasActiveDatabaseConnection);
  if (areAllDefined(req, databaseConnection, hasActiveConnection) === false || hasActiveConnection === false) {
    return;
  }
  // finally, no matter the result above, we release the databaseConnection
  databaseConnection.release();
  req.hasActiveDatabaseConnection = false;
}

module.exports = { configureRequestForResponse };
