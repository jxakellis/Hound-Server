import express from 'express';
import { HoundError, ErrorType, convertErrorToJSON } from './globalErrors';
import { logResponse } from '../tools/logging/logResponse';
import { logServerError } from '../tools/logging/logServerError';
import { databaseQuery } from '../database/databaseQuery';
import { getPoolConnection } from '../database/createDatabaseConnections';
import { ERROR } from './globalConstants';
import { ResponseBodyType } from '../types/ResponseBodyType';

function releaseDatabaseConnection(req: express.Request): void {
  if (req.databaseConnection === undefined) {
    return;
  }

  req.databaseConnection.release();
  req.databaseConnection = undefined;
}

async function commitTransaction(req: express.Request): Promise<void> {
  if (req.databaseConnection !== undefined && req.hasActiveDatabaseTransaction === true) {
    try {
      // Attempt to COMMIT the transaction
      await databaseQuery(req.databaseConnection, 'COMMIT');
      req.hasActiveDatabaseTransaction = false;
    }
    catch (commitError) {
      // COMMIT failed, attempt to rollback
      logServerError('commitTransaction COMMIT', commitError);
      try {
        await databaseQuery(req.databaseConnection, 'ROLLBACK');
        req.hasActiveDatabaseTransaction = false;
        // Backup Rollback succeeded
      }
      catch (rollbackError) {
        // Backup ROLLBACK failed, skip COMMIT and ROLLBACK since both failed
        logServerError('commitTransaction ROLLBACK', rollbackError);
      }
    }
  }

  releaseDatabaseConnection(req);
}

async function rollbackTransaction(req: express.Request): Promise<void> {
  if (req.databaseConnection !== undefined && req.hasActiveDatabaseTransaction === true) {
    try {
      await databaseQuery(req.databaseConnection, 'ROLLBACK');
      req.hasActiveDatabaseTransaction = false;
    }
    catch (rollbackError) {
      // ROLLBACK failed, continue as there is nothing we can do
      logServerError('rollbackTransaction ROLLBACK', rollbackError);
    }
  }

  releaseDatabaseConnection(req);
}

function configureRequestAndResponseConstants(req: express.Request, res: express.Response): void {
  req.requestId = undefined;
  req.hasActiveDatabaseTransaction = false;

  res.responseId = undefined;
  res.hasSentResponse = false;

  res.sendResponseForStatusBodyError = async function sendResponseForStatusBodyError(status: number, body?: unknown, error?: Error): Promise<void> {
    // Check to see if the request has an active databaseConnection
    // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
    // if there is no active transaction, then we attempt to release the databaseConnection
    if (req.databaseConnection !== undefined) {
      if (req.hasActiveDatabaseTransaction === false) {
        releaseDatabaseConnection(req);
      }
      else if (status >= 200 && status <= 299) {
        // attempt to commit transaction
        await commitTransaction(req);
      }
      else {
        // attempt to rollback transaction
        await rollbackTransaction(req);
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
        : { result: body ?? '' }),
    };

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

async function configureRequestAndResponse(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  configureRequestAndResponseConstants(req, res);

  if (req.databaseConnection !== undefined || req.hasActiveDatabaseTransaction === true) {
    return next();
  }

  try {
    const requestPoolConnection = await getPoolConnection();
    try {
      await requestPoolConnection.promise().beginTransaction();
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

export { configureRequestAndResponse };
