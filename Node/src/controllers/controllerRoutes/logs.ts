import express from 'express';
import crypto from 'crypto';
import { createLogNotification } from '../../main/tools/notifications/alert/createLogNotification.js';

import { getLogForLogIdUUID, getAllLogsForDogId } from '../getFor/getForLogs.js';

import { createLogForUserIdDogId } from '../createFor/createForLogs.js';

import { updateLogForDogIdLogId } from '../updateFor/updateForLogs.js';

import { deleteLogForLogId } from '../deleteFor/deleteForLogs.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatDate, formatNumber, formatUnknownString } from '../../main/format/formatObject.js';
import { formatLogActionToInternalValue } from '../../main/format/formatLogAction.js';

async function getLogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs, validatedLogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    const validatedLog = validatedLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getLogs, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', getLogs, ERROR_CODES.VALUE.MISSING);
    }

    if (validatedLog !== undefined && validatedLog !== null) {
      const possiblyDeletedLog = await getLogForLogIdUUID(databaseConnection, true, validatedLog.validatedLogId);

      if (possiblyDeletedLog === undefined || possiblyDeletedLog === null) {
        throw new HoundError('getLogForLogIdUUID possiblyDeletedLog missing', getLogs, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndDeclarationExtendedProperties.sendSuccessResponse(possiblyDeletedLog);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedLogs = await getAllLogsForDogId(databaseConnection, validatedDog.validatedDogId, true, previousDogManagerSynchronization);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(possibleDeletedLogs);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId, validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    const { unvalidatedLogsDictionary } = req.houndDeclarationExtendedProperties.unvalidatedVariables;
    const unvalidatedLogDictionary = unvalidatedLogsDictionary.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', createLog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createLog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (unvalidatedLogDictionary === undefined || unvalidatedLogDictionary === null) {
      throw new HoundError('unvalidatedLogDictionary missing', createLog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logUUID = formatUnknownString(unvalidatedLogDictionary?.['logUUID'] ?? crypto.randomUUID(), 36);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logStartDate = formatDate(unvalidatedLogDictionary?.['logStartDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logEndDate = formatDate(unvalidatedLogDictionary?.['logEndDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logAction = formatLogActionToInternalValue(formatUnknownString(unvalidatedLogDictionary?.['logAction']));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logCustomActionName = formatUnknownString(unvalidatedLogDictionary?.['logCustomActionName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNote = formatUnknownString(unvalidatedLogDictionary?.['logNote']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logUnit = formatUnknownString(unvalidatedLogDictionary?.['logUnit']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNumberOfLogUnits = formatNumber(unvalidatedLogDictionary?.['logNumberOfLogUnits']);

    if (logUUID === undefined || logUUID === null) {
      throw new HoundError('logUUID missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logStartDate === undefined || logStartDate === null) {
      throw new HoundError('logStartDate missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logAction === undefined || logAction === null) {
      throw new HoundError('logAction missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', createLog, ERROR_CODES.VALUE.MISSING);
    }

    const result = await createLogForUserIdDogId(
      databaseConnection,
      {
        userId: validatedUserId,
        dogId: validatedDog.validatedDogId,
        logUUID,
        logStartDate,
        logEndDate,
        logAction,
        logCustomActionName,
        logNote,
        logUnit,
        logNumberOfLogUnits,
      },
    );
    createLogNotification(
      validatedUserId,
      validatedFamilyId,
      validatedDog.validatedDogId,
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
    const { validatedUserId, validatedLogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedLog = validatedLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', updateLog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedLog === undefined || validatedLog === null) {
      throw new HoundError('validatedLog missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logStartDate = formatDate(validatedLog.unvalidatedLogDictionary?.['logStartDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logEndDate = formatDate(validatedLog.unvalidatedLogDictionary?.['logEndDate']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logAction = formatLogActionToInternalValue(formatUnknownString(validatedLog.unvalidatedLogDictionary?.['logAction']));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logCustomActionName = formatUnknownString(validatedLog.unvalidatedLogDictionary?.['logCustomActionName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNote = formatUnknownString(validatedLog.unvalidatedLogDictionary?.['logNote']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logUnit = formatUnknownString(validatedLog.unvalidatedLogDictionary?.['logUnit']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logNumberOfLogUnits = formatNumber(validatedLog.unvalidatedLogDictionary?.['logNumberOfLogUnits']);

    if (logStartDate === undefined || logStartDate === null) {
      throw new HoundError('logStartDate missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logAction === undefined || logAction === null) {
      throw new HoundError('logAction missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }

    await updateLogForDogIdLogId(
      databaseConnection,
      {
        userId: validatedUserId,
        dogId: validatedLog.validatedDogId,
        logId: validatedLog.validatedLogId,
        logUUID: validatedLog.validatedLogUUID,
        logStartDate,
        logEndDate,
        logAction,
        logCustomActionName,
        logNote,
        logUnit,
        logNumberOfLogUnits,
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
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedLogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedLog = validatedLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteLog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedLog === undefined || validatedLog === null) {
      throw new HoundError('validatedLog missing', deleteLog, ERROR_CODES.VALUE.MISSING);
    }

    await deleteLogForLogId(databaseConnection, validatedLog.validatedLogId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
