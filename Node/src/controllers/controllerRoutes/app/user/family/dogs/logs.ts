import express from 'express';
import { createLogNotification } from '../../../../../../main/tools/notifications/alert/createLogNotification.js';

import { getLogForLogUUID, getAllLogsForDogUUID } from '../../../../../get/getLogs.js';

import { createLogForLog } from '../../../../../create/createLogs.js';

import { updateLogForLog } from '../../../../../update/updateLogs.js';

import { deleteLogForLogUUID } from '../../../../../delete/deleteLogs.js';
import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import { formatDate, formatNumber, formatUnknownString } from '../../../../../../main/format/formatObject.js';
import { getAllLogActionTypes } from '../../../../../../controllers/get/types/getLogActionType.js';
import { getAllLogUnitTypes } from '../../../../../../controllers/get/types/getLogUnitType.js';

async function getLogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedDogs, validatedLogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    const validatedLog = validatedLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getLogs, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', getLogs, ERROR_CODES.VALUE.MISSING);
    }

    if (validatedLog !== undefined && validatedLog !== null) {
      const possiblyDeletedLog = await getLogForLogUUID(databaseConnection, validatedLog.validatedLogUUID, true);

      if (possiblyDeletedLog === undefined || possiblyDeletedLog === null) {
        throw new HoundError('getLogForLogUUID possiblyDeletedLog missing', getLogs, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possiblyDeletedLog);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedLogs = await getAllLogsForDogUUID(databaseConnection, validatedDog.validatedDogUUID, true, previousDogManagerSynchronization);

    return res.houndProperties.sendSuccessResponse(possibleDeletedLogs);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId, validatedFamilyId, validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    const { unvalidatedLogsDict } = req.houndProperties.unvalidatedVars;
    const unvalidatedLogDict = unvalidatedLogsDict.safeIndex(0);
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
    if (unvalidatedLogDict === undefined || unvalidatedLogDict === null) {
      throw new HoundError('unvalidatedLogDict missing', createLog, ERROR_CODES.VALUE.MISSING);
    }

    const logActionTypes = await getAllLogActionTypes(databaseConnection);
    const logUnitTypes = await getAllLogUnitTypes(databaseConnection);

    const logUUID = formatUnknownString(unvalidatedLogDict['logUUID'], 36);
    const logStartDate = formatDate(unvalidatedLogDict?.['logStartDate']);
    const logEndDate = formatDate(unvalidatedLogDict?.['logEndDate']);
    // TODO FUTURE DEPRECIATE this is compatibility for <= 3.5.0
    const depreciatedLogAction = formatUnknownString(unvalidatedLogDict?.['logAction']);
    const logActionTypeId = formatNumber(unvalidatedLogDict?.['logActionTypeId'])
    ?? logActionTypes.find((lat) => lat.internalValue === depreciatedLogAction)?.logActionTypeId;
    const logCustomActionName = formatUnknownString(unvalidatedLogDict?.['logCustomActionName']);
    const logNote = formatUnknownString(unvalidatedLogDict?.['logNote']);
    // TODO FUTURE DEPRECIATE this is compatibility for <= 3.5.0
    const depreciatedLogUnit = formatUnknownString(unvalidatedLogDict?.['logUnit']);
    const logUnitTypeId = formatNumber(unvalidatedLogDict?.['logUnitTypeId']) ?? logUnitTypes.find((lut) => lut.readableValue === depreciatedLogUnit)?.logUnitTypeId;
    const logNumberOfLogUnits = formatNumber(unvalidatedLogDict?.['logNumberOfLogUnits']);
    const logCreatedByReminderUUID = formatUnknownString(unvalidatedLogDict?.['logCreatedByReminderUUID']);

    if (logUUID === undefined || logUUID === null) {
      throw new HoundError('logUUID missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logStartDate === undefined || logStartDate === null) {
      throw new HoundError('logStartDate missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logActionTypeId === undefined || logActionTypeId === null) {
      throw new HoundError('logActionTypeId missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', createLog, ERROR_CODES.VALUE.MISSING);
    }

    const result = await createLogForLog(
      databaseConnection,
      {
        userId: validatedUserId,
        dogUUID: validatedDog.validatedDogUUID,
        logUUID,
        logStartDate,
        logEndDate,
        logActionTypeId,
        logCustomActionName,
        logNote,
        logUnitTypeId,
        logNumberOfLogUnits,
        logCreatedByReminderUUID,
      },
    );
    createLogNotification(
      validatedUserId,
      validatedFamilyId,
      validatedDog.validatedDogUUID,
      logActionTypeId,
      logCustomActionName,
    );

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function updateLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId, validatedLogs } = req.houndProperties.validatedVars;
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

    const logActionTypes = await getAllLogActionTypes(databaseConnection);
    const logUnitTypes = await getAllLogUnitTypes(databaseConnection);

    const logStartDate = formatDate(validatedLog.unvalidatedLogDict?.['logStartDate']);
    const logEndDate = formatDate(validatedLog.unvalidatedLogDict?.['logEndDate']);
    // TODO FUTURE DEPRECIATE this is compatibility for <= 3.5.0
    const depreciatedLogAction = formatUnknownString(validatedLog.unvalidatedLogDict?.['logAction']);
    const logActionTypeId = formatNumber(validatedLog.unvalidatedLogDict?.['logActionTypeId'])
    ?? logActionTypes.find((rat) => rat.internalValue === depreciatedLogAction)?.logActionTypeId;
    const logCustomActionName = formatUnknownString(validatedLog.unvalidatedLogDict?.['logCustomActionName']);
    const logNote = formatUnknownString(validatedLog.unvalidatedLogDict?.['logNote']);
    // TODO FUTURE DEPRECIATE this is compatibility for <= 3.5.0
    const depreciatedLogUnit = formatUnknownString(validatedLog.unvalidatedLogDict?.['logUnit']);
    const logUnitTypeId = formatNumber(validatedLog.unvalidatedLogDict?.['logUnitTypeId']) ?? logUnitTypes.find((lut) => lut.readableValue === depreciatedLogUnit)?.logUnitTypeId;
    const logNumberOfLogUnits = formatNumber(validatedLog.unvalidatedLogDict?.['logNumberOfLogUnits']);
    const logCreatedByReminderUUID = formatUnknownString(validatedLog.unvalidatedLogDict?.['logCreatedByReminderUUID']);

    if (logStartDate === undefined || logStartDate === null) {
      throw new HoundError('logStartDate missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logActionTypeId === undefined || logActionTypeId === null) {
      throw new HoundError('logActionTypeId missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }

    await updateLogForLog(
      databaseConnection,
      {
        userId: validatedUserId,
        dogUUID: validatedLog.validatedDogUUID,
        logId: validatedLog.validatedLogId,
        logUUID: validatedLog.validatedLogUUID,
        logStartDate,
        logEndDate,
        logActionTypeId,
        logCustomActionName,
        logNote,
        logUnitTypeId,
        logNumberOfLogUnits,
        logCreatedByReminderUUID,
      },
    );
    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function deleteLog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedLogs } = req.houndProperties.validatedVars;
    const validatedLog = validatedLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteLog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedLog === undefined || validatedLog === null) {
      throw new HoundError('validatedLog missing', deleteLog, ERROR_CODES.VALUE.MISSING);
    }

    await deleteLogForLogUUID(databaseConnection, validatedLog.validatedLogUUID);

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
