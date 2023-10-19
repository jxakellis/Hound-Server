import express from 'express';
import { HoundError, ERROR_CODES, convertErrorToJSON } from './globalErrors';
import { logResponse } from '../logging/logResponse';
import { logServerError } from '../logging/logServerError';
import { databaseQuery } from '../database/databaseQuery';
import { getDatabaseConnections } from '../database/databaseConnections';
import { type ResponseBodyType } from '../types/ResponseBodyType';

function releaseDatabaseConnection(req: express.Request): void {
  if (req.houndDeclarationExtendedProperties.databaseConnection === undefined) {
    return;
  }

  req.houndDeclarationExtendedProperties.databaseConnection.release();
  req.houndDeclarationExtendedProperties.databaseConnection = undefined;
}

async function commitTransaction(req: express.Request): Promise<void> {
  if (req.houndDeclarationExtendedProperties.databaseConnection !== undefined && req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction === true) {
    try {
      // Attempt to COMMIT the transaction
      await databaseQuery(req.houndDeclarationExtendedProperties.databaseConnection, 'COMMIT');
      req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction = false;
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
        await databaseQuery(req.houndDeclarationExtendedProperties.databaseConnection, 'ROLLBACK');
        req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction = false;
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
  if (req.houndDeclarationExtendedProperties.databaseConnection !== undefined && req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction === true) {
    try {
      await databaseQuery(req.houndDeclarationExtendedProperties.databaseConnection, 'ROLLBACK');
      req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction = false;
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
  req.houndDeclarationExtendedProperties = {
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
      validatedReminderIds: [],
    },
  };
  res.houndDeclarationExtendedProperties = {
    responseId: undefined,
    hasSentResponse: false,
    sendSuccessResponse: async function sendSuccessResponse(body: NonNullable<unknown>): Promise<void> {
      const status = 200;
      // Check to see if the request has an active databaseConnection
      // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (req.houndDeclarationExtendedProperties.databaseConnection !== undefined) {
        if (req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction === false) {
          releaseDatabaseConnection(req);
        }
        else {
          // attempt to commit transaction
          await commitTransaction(req);
        }
      }

      // Check to see if a response has been sent yet
      if (res.houndDeclarationExtendedProperties.hasSentResponse === true) {
        return;
      }

      const socketDestroyed = res?.socket?.destroyed;

      if (socketDestroyed === undefined || socketDestroyed === true) {
        return;
      }

      // If we user provided an error, then we convert that error to JSON and use it as the body

      const response: ResponseBodyType = { result: body };

      await logResponse(req, res, status, JSON.stringify(response));

      if (req.originalUrl !== '/watchdog') {
        // need to update watchdog so it recognizes pattern of requestId and responseId. currently can only recognize {"result":""} as success
        response.requestId = req.houndDeclarationExtendedProperties.requestId ?? -1;
        response.responseId = res.houndDeclarationExtendedProperties.responseId ?? -1;
      }

      res.houndDeclarationExtendedProperties.hasSentResponse = true;
      res.status(status).json(response);
    },
    sendFailureResponse: async function sendFailureResponse(error?: HoundError): Promise<void> {
      const status = 400;
      // Check to see if the request has an active databaseConnection
      // If it does, then we attempt to COMMIT or ROLLBACK (and if they fail, the functions release() anyways)
      // if there is no active transaction, then we attempt to release the databaseConnection
      if (req.houndDeclarationExtendedProperties.databaseConnection !== undefined) {
        if (req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction === false) {
          releaseDatabaseConnection(req);
        }
        else {
          // attempt to rollback transaction
          await rollbackTransaction(req);
        }
      }

      // Check to see if a response has been sent yet
      if (res.houndDeclarationExtendedProperties.hasSentResponse === true) {
        return;
      }

      const socketDestroyed = res?.socket?.destroyed;

      if (socketDestroyed === undefined || socketDestroyed === true) {
        return;
      }

      // If we user provided an error, then we convert that error to JSON and use it as the body

      const response: ResponseBodyType = (error !== undefined && error instanceof Error) ? convertErrorToJSON(error) : convertErrorToJSON(undefined);

      await logResponse(req, res, status, JSON.stringify(response));

      if (req.originalUrl !== '/watchdog') {
        // need to update watchdog so it recognizes pattern of requestId and responseId. currently can only recognize {"result":""} as success
        response.requestId = req.houndDeclarationExtendedProperties.requestId ?? -1;
        response.responseId = res.houndDeclarationExtendedProperties.responseId ?? -1;
      }

      res.houndDeclarationExtendedProperties.hasSentResponse = true;
      res.status(status).json(response);
    },
  };
}

async function configureRequestAndResponse(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  configureRequestAndResponseExtendedProperties(req, res);

  if (req.houndDeclarationExtendedProperties.databaseConnection !== undefined || req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction === true) {
    return next();
  }

  try {
    const { getPoolConnection } = await getDatabaseConnections();
    const requestPoolConnection = await getPoolConnection();
    try {
      await requestPoolConnection.promise().beginTransaction();
      req.houndDeclarationExtendedProperties.databaseConnection = requestPoolConnection;
      req.houndDeclarationExtendedProperties.hasActiveDatabaseTransaction = true;
    }
    catch (transactionError) {
      return res.houndDeclarationExtendedProperties.sendFailureResponse(
        new HoundError("Couldn't begin a transaction with databaseConnection", configureRequestAndResponse, ERROR_CODES.GENERAL.POOL_TRANSACTION_FAILED, transactionError),
      );
    }
  }
  catch (databaseConnectionError) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(
      new HoundError("Couldn't get a connection from databaseConnectionPoolForRequests", configureRequestAndResponse, ERROR_CODES.GENERAL.POOL_CONNECTION_FAILED, databaseConnectionError),
    );
  }

  return next();
}

export { configureRequestAndResponse };
