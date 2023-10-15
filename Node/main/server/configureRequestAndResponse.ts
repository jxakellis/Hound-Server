import express from 'express';
import { HoundError, ERROR_CODES, convertErrorToJSON } from './globalErrors';
import { logResponse } from '../logging/logResponse';
import { logServerError } from '../logging/logServerError';
import { databaseQuery } from '../database/databaseQuery';
import { getPoolConnection } from '../database/createDatabaseConnections';
import { ResponseBodyType } from '../types/ResponseBodyType';

function releaseDatabaseConnection(req: express.Request): void {
  if (req.extendedProperties.databaseConnection === undefined) {
    return;
  }

  req.extendedProperties.databaseConnection.release();
  req.extendedProperties.databaseConnection = undefined;
}

async function commitTransaction(req: express.Request): Promise<void> {
  if (req.extendedProperties.databaseConnection !== undefined && req.extendedProperties.hasActiveDatabaseTransaction === true) {
    try {
      // Attempt to COMMIT the transaction
      await databaseQuery(req.extendedProperties.databaseConnection, 'COMMIT');
      req.extendedProperties.hasActiveDatabaseTransaction = false;
    }
    catch (commitError) {
      // COMMIT failed, attempt to rollback
      logServerError('commitTransaction COMMIT', commitError);
      try {
        await databaseQuery(req.extendedProperties.databaseConnection, 'ROLLBACK');
        req.extendedProperties.hasActiveDatabaseTransaction = false;
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
  if (req.extendedProperties.databaseConnection !== undefined && req.extendedProperties.hasActiveDatabaseTransaction === true) {
    try {
      await databaseQuery(req.extendedProperties.databaseConnection, 'ROLLBACK');
      req.extendedProperties.hasActiveDatabaseTransaction = false;
    }
    catch (rollbackError) {
      // ROLLBACK failed, continue as there is nothing we can do
      logServerError('rollbackTransaction ROLLBACK', rollbackError);
    }
  }

  releaseDatabaseConnection(req);
}

function configureRequestAndResponseExtendedProperties(req: express.Request, res: express.Response): void {
  req.extendedProperties = {
    requestId: undefined,
    databaseConnection: undefined,
    hasActiveDatabaseTransaction: false,
    familyActiveSubscription: undefined,
    validatedVariables: {
      validatedUserId: undefined,
      validatedUserIdentifier: undefined,
      validatedFamilyId: undefined,
      validatedDogId: undefined,
      validatedLogId: undefined,
      validatedReminderId: undefined,
      validatedReminderIds: [],
    },
  };
  res.extendedProperties = {
    responseId: undefined,
    hasSentResponse: false,
    sendResponseForStatusBodyError: async function sendResponseForStatusBodyError(status: number, body?: { [key: string]: unknown }, error?: unknown): Promise<void> {
      // Check to see if the request has an active databaseConnection
      // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (req.extendedProperties.databaseConnection !== undefined) {
        if (req.extendedProperties.hasActiveDatabaseTransaction === false) {
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
      if (res.extendedProperties.hasSentResponse === true) {
        return;
      }

      const socketDestroyed = res?.socket?.destroyed;

      if (socketDestroyed === undefined || socketDestroyed === true) {
        return;
      }

      // If we user provided an error, then we convert that error to JSON and use it as the body

      let response: ResponseBodyType;
      if (error !== undefined) {
        if (error instanceof Error) {
          response = convertErrorToJSON(error);
        }
        else {
          response = convertErrorToJSON(undefined);
        }
      }
      else {
        response = { result: body ?? '' };
      }

      await logResponse(req, res, status, JSON.stringify(response));

      if (req.originalUrl !== '/watchdog') {
        // need to update watchdog so it recognizes pattern of requestId and responseId. currently can only recognize {"result":""} as success
        response.requestId = req.extendedProperties.requestId ?? -1;
        response.responseId = res.extendedProperties.responseId ?? -1;
      }

      res.extendedProperties.hasSentResponse = true;
      res.status(status).json(response);
    },
  };
}

async function configureRequestAndResponse(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  configureRequestAndResponseExtendedProperties(req, res);

  if (req.extendedProperties.databaseConnection !== undefined || req.extendedProperties.hasActiveDatabaseTransaction === true) {
    return next();
  }

  try {
    const requestPoolConnection = await getPoolConnection();
    try {
      await requestPoolConnection.promise().beginTransaction();
      req.extendedProperties.databaseConnection = requestPoolConnection;
      req.extendedProperties.hasActiveDatabaseTransaction = true;
    }
    catch (transactionError) {
      return res.extendedProperties.sendResponseForStatusBodyError(
        500,
        undefined,
        new HoundError("Couldn't begin a transaction with databaseConnection", 'configureRequestAndResponse', ERROR_CODES.GENERAL.POOL_TRANSACTION_FAILED, transactionError),
      );
    }
  }
  catch (databaseConnectionError) {
    return res.extendedProperties.sendResponseForStatusBodyError(
      500,
      undefined,
      new HoundError("Couldn't get a connection from databaseConnectionPoolForRequests", 'configureRequestAndResponse', ERROR_CODES.GENERAL.POOL_CONNECTION_FAILED, databaseConnectionError),
    );
  }

  return next();
}

export { configureRequestAndResponse };
