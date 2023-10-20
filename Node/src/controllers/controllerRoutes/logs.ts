import express from 'express';
import { createLogNotification } from '../../main/tools/notifications/alert/createLogNotification.js';

import { getLogForLogId, getAllLogsForDogId } from '../getFor/getForLogs.js';

import { createLogForUserIdDogId } from '../createFor/createForLogs.js';

import { updateLogForDogIdLogId } from '../updateFor/updateForLogs.js';

import { deleteLogForLogId } from '../deleteFor/deleteForLogs.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatDate, formatUnknownString } from '../../main/format/formatObject.js';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) logId formatted correctly and request has sufficient permissions to use
*/
async function getLogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogId, validatedLogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getLogs, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', getLogs, ERROR_CODES.VALUE.INVALID);
    }

    const result = validatedLogId !== undefined
    // if logId is defined and it is a number then continue to find a single log
      ? await getLogForLogId(databaseConnection, validatedLogId, previousDogManagerSynchronization)
    // query for multiple logs
      : await getAllLogsForDogId(databaseConnection, validatedDogId, previousDogManagerSynchronization);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', getLogs, ERROR_CODES.VALUE.INVALID);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId, validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logDate = formatDate(req.body['logDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logAction = formatUnknownString(req.body['logAction']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logCustomActionName = formatUnknownString(req.body['logCustomActionName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNote = formatUnknownString(req.body['logNote']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('validatedFamilyId missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logDate === undefined || logDate === null) {
      throw new HoundError('logDate missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logAction === undefined || logAction === null) {
      throw new HoundError('logAction missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', createLog, ERROR_CODES.VALUE.INVALID);
    }

    const result = await createLogForUserIdDogId(
      databaseConnection,
      {
        userId: validatedUserId,
        dogId: validatedDogId,
        logDate,
        logAction,
        logCustomActionName,
        logNote,
      },
    );
    createLogNotification(
      validatedUserId,
      validatedFamilyId,
      validatedDogId,
      logAction,
      logCustomActionName,
    );

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedDogId, validatedLogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logDate = formatDate(req.body['logDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logAction = formatUnknownString(req.body['logAction']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logCustomActionName = formatUnknownString(req.body['logCustomActionName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNote = formatUnknownString(req.body['logNote']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedLogId === undefined || validatedLogId === null) {
      throw new HoundError('validatedLogId missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logDate === undefined || logDate === null) {
      throw new HoundError('logDate missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logAction === undefined || logAction === null) {
      throw new HoundError('logAction missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }

    await updateLogForDogIdLogId(
      databaseConnection,
      {
        userId: validatedUserId,
        dogId: validatedDogId,
        logId: validatedLogId,
        logDate,
        logAction,
        logCustomActionName,
        logNote,
      },
    );
    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedLogId } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedLogId === undefined || validatedLogId === null) {
      throw new HoundError('validatedLogId missing', deleteLog, ERROR_CODES.VALUE.INVALID);
    }

    await deleteLogForLogId(databaseConnection, validatedLogId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
