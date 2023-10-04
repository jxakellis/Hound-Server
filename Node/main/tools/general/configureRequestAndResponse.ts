import express from 'express';
import { HoundError, ErrorType, convertErrorToJSON } from './errors';
import { logResponse } from '../logging/logResponse';
import { logServerError } from '../logging/logServerError';
import { formatNumber, formatBoolean } from '../format/formatObject';
import { Queryable, databaseQuery } from '../database/databaseQuery';
import { databaseConnectionPoolForRequests } from '../database/createDatabaseConnections';
import { ERROR } from '../../server/globalConstants';
import { ResponseBodyType } from '../types/ResponseBodyType';

async function configureRequestAndResponse(req: express.Request, res: express.Response, next: express.NextFunction) {
  req.requestId = undefined;
  req.hasActiveDatabaseConnection = false;
  req.hasActiveDatabaseTransaction = false;

  configureResponse(req, res);

  if (req.hasActiveDatabaseConnection === true || req.hasActiveDatabaseTransaction === true) {
    return next();
  }

  try {
    const requestPoolConnection = await databaseConnectionPoolForRequests.promise().getConnection();
    req.hasActiveDatabaseConnection = true;
    try {
      await requestPoolConnection.beginTransaction();
      req.databaseConnection = requestPoolConnection;
      req.hasActiveDatabaseTransaction = true;
    }
    catch (transactionError) {
      return res.sendResponseForStatusBodyError(
        500,
        null,
        new HoundError("Couldn't begin a transaction with databaseConnection", ErrorType.Database, ERROR.GENERAL.POOL_TRANSACTION_FAILED),
      );
    }
  }
  catch (databaseConnectionError) {
    return res.sendResponseForStatusBodyError(
      500,
      null,
      new HoundError("Couldn't get a connection from databaseConnectionPoolForRequests", ErrorType.Database, ERROR.GENERAL.POOL_CONNECTION_FAILED),
    );
  }

  return next();
}

function configureResponse(req: express.Request, res: express.Response) {
  res.responseId = undefined;
  res.hasSentResponse = false;

  res.sendResponseForStatusBodyError = async function sendResponseForStatusBodyError(status: number, body?: unknown, error?: Error) {
    // Check to see if the request has an active databaseConnection
    // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
    if (req.hasActiveDatabaseConnection === true) {
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (req.hasActiveDatabaseTransaction === false) {
        releaseDatabaseConnection(req, req.databaseConnection, req.hasActiveDatabaseConnection);
      }
      else if (status >= 200 && status <= 299) {
        // attempt to commit transaction
        await commitTransaction(req, req.databaseConnection);
      }
      else {
        // attempt to rollback transaction
        await rollbackTransaction(req, req.databaseConnection);
      }
    }

    // Check to see if a response has been sent yet
    if (res.hasSentResponse === true) {
      return;
    }

    const socketDestroyed = res?.socket?.destroyed;

    if (socketDestroyed === undefined || socketDestroyed === true) {
      return;
    }

    // If we user provided an error, then we convert that error to JSON and use it as the body

    const response: ResponseBodyType = {
      ...(error !== undefined
      ? convertErrorToJSON(error)
      : { result: body ?? '' })
    }

    await logResponse(req, res, status, response);

    if (req.originalUrl !== '/watchdog') {
      // need to update watchdog so it recognizes pattern of requestId and responseId. currently can only recognize {"result":""} as success
      response.requestId = req.requestId ?? -1;
      response.responseId = res.responseId ?? -1;
    }

    res.hasSentResponse = true;
    res.status(status).json(response);
  };
}

async function commitTransaction(req: express.Request, databaseConnection: Queryable) {
  if (req.hasActiveConnection === false) {
    return;
  }

  if (req.hasActiveTransaction === true) {
    try {
      // Attempt to COMMIT the transaction
      await databaseQuery(databaseConnection, 'COMMIT';
      req.hasActiveDatabaseTransaction = false;
    }
    catch (commitError) {
      // COMMIT failed, attempt to rollback
      logServerError('commitTransaction COMMIT', commitError);
      try {
        await databaseQuery(databaseConnection, 'ROLLBACK';
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

async function rollbackTransaction(req: express.Request, databaseConnection: Queryable) {
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
      await databaseQuery(databaseConnection, 'ROLLBACK';
      req.hasActiveDatabaseTransaction = false;
    }
    catch (rollbackError) {
      // ROLLBACK failed, continue as there is nothing we can do
      logServerError('rollbackTransaction ROLLBACK', rollbackError);
    }
  }

  releaseDatabaseConnection(req, databaseConnection);
}

function releaseDatabaseConnection(req: express.Request, databaseConnection: Queryable) {
  const hasActiveConnection = formatBoolean(hasActiveDatabaseConnection);
  if (areAllDefined(req, databaseConnection, hasActiveConnection) === false || hasActiveConnection === false) {
    return;
  }
  // finally, no matter the result above, we release the databaseConnection
  databaseConnection.release();
  req.hasActiveDatabaseConnection = false;
}

export { configureRequestAndResponse };
