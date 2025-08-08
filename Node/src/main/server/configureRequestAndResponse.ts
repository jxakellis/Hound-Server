import express from 'express';
import type { PoolConnection } from 'mysql2';
import { HoundError, ERROR_CODES } from './globalErrors.js';
import { logResponse } from '../logging/logResponse.js';
import { logServerError } from '../logging/logServerError.js';
import { databaseQuery, type SQLQueryLogEntry } from '../database/databaseQuery.js';
import { DatabasePools, getPoolConnection } from '../database/databaseConnections.js';
import { type ResponseBodyType } from '../types/ResponseBodyType.js';
import { SERVER } from './globalConstants.js';
import { requestLogger } from '../logging/loggers.js';

function releaseDatabaseConnection(req: express.Request): void {
  if (req.houndProperties.databaseConnection === undefined || req.houndProperties.databaseConnection === null) {
    return;
  }

  const connectionWithLog = req.houndProperties.databaseConnection as PoolConnection & { houndQueryLog?: SQLQueryLogEntry[] };

  if (SERVER.CONSOLE_LOGGING_ENABLED === true && connectionWithLog.houndQueryLog !== undefined) {
    const { houndQueryLog } = connectionWithLog;
    requestLogger.debug(`Request ${req.houndProperties.requestId ?? 'unknown'} executed ${houndQueryLog.length} queries`);
    houndQueryLog.forEach((entry, index) => {
      requestLogger.debug(`\t${index} | ${entry.durationMs} ms | ${entry.sql.slice(0, 100)}`);
    });
    connectionWithLog.houndQueryLog = [];
  }

  if (req.houndProperties.hasActiveDatabaseTransaction === true) {
    // If a transaction is still open, destroy the connection to avoid returning a "dirty" connection to the pool
    req.houndProperties.databaseConnection.destroy();
  }
  else {
    req.houndProperties.databaseConnection.release();
  }

  req.houndProperties.databaseConnection = undefined;
  req.houndProperties.hasActiveDatabaseTransaction = false;
}

async function commitTransaction(req: express.Request): Promise<void> {
  if (req.houndProperties.databaseConnection !== undefined && req.houndProperties.hasActiveDatabaseTransaction === true) {
    try {
      // Attempt to COMMIT the transaction
      await databaseQuery(req.houndProperties.databaseConnection, 'COMMIT');
      req.houndProperties.hasActiveDatabaseTransaction = false;
    }
    catch (commitError) {
      // COMMIT failed, attempt to rollback
      logServerError(
        new HoundError(
          'COMMIT failed, attempting to rollback',
          commitTransaction,
          undefined,
          commitError,
        ),
      );
      try {
        await databaseQuery(req.houndProperties.databaseConnection, 'ROLLBACK');
        req.houndProperties.hasActiveDatabaseTransaction = false;
        // Backup Rollback succeeded
      }
      catch (rollbackError) {
        // Backup ROLLBACK failed, skip COMMIT and ROLLBACK since both failed
        logServerError(
          new HoundError(
            'ROLLBACK failed',
            commitTransaction,
            undefined,
            rollbackError,
          ),
        );
      }
    }
  }

  releaseDatabaseConnection(req);
}

async function rollbackTransaction(req: express.Request): Promise<void> {
  if (req.houndProperties.databaseConnection !== undefined && req.houndProperties.hasActiveDatabaseTransaction === true) {
    try {
      await databaseQuery(req.houndProperties.databaseConnection, 'ROLLBACK');
      req.houndProperties.hasActiveDatabaseTransaction = false;
    }
    catch (rollbackError) {
      // ROLLBACK failed, continue as there is nothing we can do
      logServerError(
        new HoundError(
          'ROLLBACK failed',
          rollbackTransaction,
          undefined,
          rollbackError,
        ),
      );
    }
  }

  releaseDatabaseConnection(req);
}

function configureRequestAndResponseExtendedProperties(req: express.Request, res: express.Response): void {
  req.houndProperties = {
    requestId: undefined,
    databaseConnection: undefined,
    hasActiveDatabaseTransaction: false,
    authenticated: {
      authUserId: undefined,
      authUserIdentifier: undefined,
      authFamilyId: undefined,
      authFamilyActiveSubscription: undefined,
      authDogs: [],
      authLogs: [],
      authReminders: [],
      authTriggers: [],
    },
    unauthenticated: {
      unauthDogsDict: [],
      unauthLogsDict: [],
      unauthRemindersDict: [],
      unauthTriggersDict: [],
      unauthSurveyFeedbackDict: {},
    },
  };
  res.houndProperties = {
    responseId: undefined,
    hasSentResponse: false,
    sendSuccessResponse: async function sendSuccessResponse(body: NonNullable<unknown>): Promise<void> {
      const status = 200;
      // Check to see if the request has an active databaseConnection
      // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (req.houndProperties.databaseConnection !== undefined && req.houndProperties.databaseConnection !== null) {
        if (req.houndProperties.hasActiveDatabaseTransaction === false) {
          releaseDatabaseConnection(req);
        }
        else {
          // attempt to commit transaction
          await commitTransaction(req);
        }
      }

      // Check to see if a response has been sent yet
      if (res.houndProperties.hasSentResponse === true) {
        return;
      }

      const socketDestroyed = res?.socket?.destroyed;

      if (socketDestroyed === undefined || socketDestroyed === null || socketDestroyed === true) {
        return;
      }

      // If we user provided an error, then we convert that error to JSON and use it as the body

      const response: ResponseBodyType = { result: body };

      await logResponse(req, res, status, JSON.stringify(response));

      if (req.originalUrl !== '/watchdog') {
        // need to update watchdog so it recognizes pattern of requestId and responseId. currently can only recognize {'result':''} as success
        response.requestId = req.houndProperties.requestId ?? -1;
        response.responseId = res.houndProperties.responseId ?? -1;
      }

      res.houndProperties.hasSentResponse = true;
      res.status(status).json(response);
    },
    sendFailureResponse: async function sendFailureResponse(error?: unknown): Promise<void> {
      const status = 400;
      // Check to see if the request has an active databaseConnection
      // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (req.houndProperties.databaseConnection !== undefined && req.houndProperties.databaseConnection !== null) {
        if (req.houndProperties.hasActiveDatabaseTransaction === false) {
          releaseDatabaseConnection(req);
        }
        else {
          // attempt to rollback transaction
          await rollbackTransaction(req);
        }
      }

      // Check to see if a response has been sent yet
      if (res.houndProperties.hasSentResponse === true) {
        return;
      }

      const socketDestroyed = res?.socket?.destroyed;

      if (socketDestroyed === undefined || socketDestroyed === null || socketDestroyed === true) {
        return;
      }

      // If we user provided an error, then we convert that error to JSON and use it as the body
      // By default, we initialize this message to the error missing message
      let unsafeForUsersResponseDoNotSendWithoutRemovingPrivateInfo = new HoundError('error missing', sendFailureResponse, undefined, error).toJSON();

      // If there is an Error provided that we can decode, overwrite the original message
      if (error !== undefined && error !== null) {
        if (error instanceof HoundError) {
          unsafeForUsersResponseDoNotSendWithoutRemovingPrivateInfo = error.toJSON();
        }
        else if (error instanceof Error) {
          unsafeForUsersResponseDoNotSendWithoutRemovingPrivateInfo = new HoundError(undefined, sendFailureResponse, undefined, error).toJSON();
        }
      }

      await logResponse(req, res, status, JSON.stringify(unsafeForUsersResponseDoNotSendWithoutRemovingPrivateInfo));

      const safeResponse: ResponseBodyType = {
        ...unsafeForUsersResponseDoNotSendWithoutRemovingPrivateInfo,
        stack: undefined,
        debugInfo: undefined,
      };

      if (req.originalUrl !== '/watchdog') {
        // need to update watchdog so it recognizes pattern of requestId and responseId. currently can only recognize {'result':''} as success
        safeResponse.requestId = req.houndProperties.requestId ?? -1;
        safeResponse.responseId = res.houndProperties.responseId ?? -1;
      }

      res.houndProperties.hasSentResponse = true;
      res.status(status).json(safeResponse);
    },
  };

  res.on('close', async () => {
    if (req.houndProperties.databaseConnection !== undefined && req.houndProperties.databaseConnection !== null) {
      if (req.houndProperties.hasActiveDatabaseTransaction === true) {
        await rollbackTransaction(req);
      }
      else {
        releaseDatabaseConnection(req);
      }
    }
  });
}

async function configureRequestAndResponse(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  configureRequestAndResponseExtendedProperties(req, res);

  if (req.houndProperties.databaseConnection !== undefined && req.houndProperties.databaseConnection !== null) {
    return next();
  }
  if (req.houndProperties.hasActiveDatabaseTransaction === true) {
    return next();
  }

  let requestPoolConnection: PoolConnection | undefined;
  try {
    requestPoolConnection = await getPoolConnection(DatabasePools.request);
    if (SERVER.CONSOLE_LOGGING_ENABLED === true) {
      (requestPoolConnection as PoolConnection & { houndQueryLog: SQLQueryLogEntry[] }).houndQueryLog = [];
    }
  }
  catch (databaseConnectionError) {
    return res.houndProperties.sendFailureResponse(
      new HoundError('Couldn\'t get a connection from databasePoolForRequests', configureRequestAndResponse, ERROR_CODES.GENERAL.POOL_CONNECTION_FAILED, databaseConnectionError),
    );
  }

  try {
    await requestPoolConnection.promise().beginTransaction();
  }
  catch (transactionError) {
    // If beginTransaction failed, destroy the connection to avoid returning a bad connection to the pool
    // dont use release releaseDatabaseConnection b/c houndProperties aren't set
    requestPoolConnection.destroy();
    return res.houndProperties.sendFailureResponse(
      new HoundError('Couldn\'t begin a transaction with databaseConnection', configureRequestAndResponse, ERROR_CODES.GENERAL.POOL_TRANSACTION_FAILED, transactionError),
    );
  }

  req.houndProperties.databaseConnection = requestPoolConnection;
  req.houndProperties.hasActiveDatabaseTransaction = true;

  return next();
}

export { configureRequestAndResponse };
