import express from 'express';
import { createLogNotification } from '../../main/tools/notifications/alert/createLogNotification';

import { getLogForLogId, getAllLogsForDogId } from '../getFor/getForLogs';

import { createLogForUserIdDogId } from '../createFor/createForLogs';

import { updateLogForDogIdLogId } from '../updateFor/updateForLogs';

import { deleteLogForLogId } from '../deleteFor/deleteForLogs';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatDate, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) logId formatted correctly and request has sufficient permissions to use
*/
async function getLogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedDogId, validatedLogId } = req.extendedProperties.validatedVariables;
    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getLogs, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', getLogs, ERROR_CODES.VALUE.INVALID);
    }

    const result = validatedLogId !== undefined
    // if logId is defined and it is a number then continue to find a single log
      ? await getLogForLogId(databaseConnection, validatedLogId, previousDogManagerSynchronization)
    // query for multiple logs
      : await getAllLogsForDogId(databaseConnection, validatedDogId, previousDogManagerSynchronization);

    if (result === undefined) {
      throw new HoundError('result missing', getLogs, ERROR_CODES.VALUE.INVALID);
    }

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId, validatedFamilyId, validatedDogId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logDate = formatDate(req.body['logDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logAction = formatUnknownString(req.body['logAction']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logCustomActionName = formatUnknownString(req.body['logCustomActionName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNote = formatUnknownString(req.body['logNote']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logDate === undefined) {
      throw new HoundError('logDate missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logAction === undefined) {
      throw new HoundError('logAction missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logCustomActionName === undefined) {
      throw new HoundError('logCustomActionName missing', createLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logNote === undefined) {
      throw new HoundError('logNote missing', createLog, ERROR_CODES.VALUE.INVALID);
    }

    const result = await createLogForUserIdDogId(
      databaseConnection,
      {
        userId: validatedUserId,
        dogId: validatedDogId,
        // this value is unused, we just need a placeholder for a valid DogLogsRow
        logId: -1,
        logDate,
        logAction,
        logCustomActionName,
        logNote,
        // this value is unused, we just need a placeholder for a valid DogLogsRow
        logLastModified: new Date(),
        // this value is unused, we just need a placeholder for a valid DogLogsRow
        logIsDeleted: 0,
      },
    );
    createLogNotification(
      validatedUserId,
      validatedFamilyId,
      validatedDogId,
      logAction,
      logCustomActionName,
    );

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function updateLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId, validatedDogId, validatedLogId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logDate = formatDate(req.body['logDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logAction = formatUnknownString(req.body['logAction']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logCustomActionName = formatUnknownString(req.body['logCustomActionName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNote = formatUnknownString(req.body['logNote']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedLogId === undefined) {
      throw new HoundError('validatedLogId missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logDate === undefined) {
      throw new HoundError('logDate missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logAction === undefined) {
      throw new HoundError('logAction missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logCustomActionName === undefined) {
      throw new HoundError('logCustomActionName missing', updateLog, ERROR_CODES.VALUE.INVALID);
    }
    if (logNote === undefined) {
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
        // this value is unused, we just need a placeholder for a valid DogLogsRow
        logLastModified: new Date(),
        // this value is unused, we just need a placeholder for a valid DogLogsRow
        logIsDeleted: 0,
      },
    );
    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function deleteLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedLogId } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', deleteLog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedLogId === undefined) {
      throw new HoundError('validatedLogId missing', deleteLog, ERROR_CODES.VALUE.INVALID);
    }

    await deleteLogForLogId(databaseConnection, validatedLogId);

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
