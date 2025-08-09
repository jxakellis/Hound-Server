import express from 'express';
import { createLogNotification } from '../../../../../../main/tools/notifications/alert/createLogNotification.js';

import { getLogForLogUUID, getAllLogsForDogUUID } from '../../../../../get/logs/getLogs.js';

import { createSingleLog } from '../../../../../create/logs/createLogs.js';

import { updateLogForLog } from '../../../../../update/updateLogs.js';

import { deleteLogForLogUUID } from '../../../../../delete/logs/deleteLogs.js';
import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import {
  formatArray, formatDate, formatNumber, formatUnknownString,
} from '../../../../../../main/format/formatObject.js';
import { createLogLikeNotification } from '../../../../../../main/tools/notifications/alert/createLogLikeNotification.js';

async function getLogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authDogs, authLogs } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    const authLog = authLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getLogs, ERROR_CODES.VALUE.MISSING);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', getLogs, ERROR_CODES.VALUE.MISSING);
    }

    if (authLog !== undefined && authLog !== null) {
      const possiblyDeletedLog = await getLogForLogUUID(databaseConnection, authLog.authLog.logUUID, true);

      if (possiblyDeletedLog === undefined || possiblyDeletedLog === null) {
        throw new HoundError('getLogForLogUUID possiblyDeletedLog missing', getLogs, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possiblyDeletedLog);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedLogs = await getAllLogsForDogUUID(databaseConnection, authDog.authDog.dogUUID, true, previousDogManagerSynchronization);

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
    const { authUserId, authFamilyId, authDogs } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    const { unauthLogsDict } = req.houndProperties.unauthenticated;
    const unauthNewLogDict = unauthLogsDict.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', createLog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createLog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (unauthNewLogDict === undefined || unauthNewLogDict === null) {
      throw new HoundError('unauthNewLogDict missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    const logUUID = formatUnknownString(unauthNewLogDict['logUUID'], 36);
    const logStartDate = formatDate(unauthNewLogDict?.['logStartDate']);
    const logEndDate = formatDate(unauthNewLogDict?.['logEndDate']);
    const logActionTypeId = formatNumber(unauthNewLogDict?.['logActionTypeId']);
    const logCustomActionName = formatUnknownString(unauthNewLogDict?.['logCustomActionName']);
    const logNote = formatUnknownString(unauthNewLogDict?.['logNote']);
    const logUnitTypeId = formatNumber(unauthNewLogDict?.['logUnitTypeId']);
    const logNumberOfLogUnits = formatNumber(unauthNewLogDict?.['logNumberOfLogUnits']);
    const logCreatedByReminderUUID = formatUnknownString(unauthNewLogDict?.['logCreatedByReminderUUID']);
    const rawLikedByUserIds = formatArray(unauthNewLogDict?.['logLikedByUserIds']);
    // if creating a log, then only user who could have liked the log is the user creating it
    const logLikedByUserIds = rawLikedByUserIds !== undefined
      ? rawLikedByUserIds.map((id) => formatUnknownString(id) ?? '').filter((id) => id !== '' && id === authUserId)
      : [];

    if (logUUID === undefined || logUUID === null) {
      throw new HoundError('logUUID missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logStartDate === undefined || logStartDate === null) {
      throw new HoundError('logStartDate missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    // logEndDate optinal
    if (logActionTypeId === undefined || logActionTypeId === null) {
      throw new HoundError('logActionTypeId missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logCustomActionName === undefined || logCustomActionName === null) {
      throw new HoundError('logCustomActionName missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    if (logNote === undefined || logNote === null) {
      throw new HoundError('logNote missing', createLog, ERROR_CODES.VALUE.MISSING);
    }
    // logUnitTypeId optional
    // logNumberOfLogUnits optional
    // logCreatedByReminderUUID optional

    const result = await createSingleLog(
      databaseConnection,
      {
        dogUUID: authDog.authDog.dogUUID,
        logUUID,
        logStartDate,
        logEndDate,
        logActionTypeId,
        logCustomActionName,
        logNote,
        logUnitTypeId,
        logNumberOfLogUnits,
        logCreatedByReminderUUID,
        logCreatedBy: authUserId,
        logLikedByUserIds,
      },
    );

    await createLogNotification(
      databaseConnection,
      authUserId,
      authFamilyId,
      authDog.authDog.dogUUID,
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
    const { authUserId, authLogs } = req.houndProperties.authenticated;
    const authLog = authLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', updateLog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authLog === undefined || authLog === null) {
      throw new HoundError('authLog missing', updateLog, ERROR_CODES.VALUE.MISSING);
    }
    const logStartDate = formatDate(authLog.unauthNewLogDict?.['logStartDate']);
    const logEndDate = formatDate(authLog.unauthNewLogDict?.['logEndDate']);
    const logActionTypeId = formatNumber(authLog.unauthNewLogDict?.['logActionTypeId']);
    const logCustomActionName = formatUnknownString(authLog.unauthNewLogDict?.['logCustomActionName']);
    const logNote = formatUnknownString(authLog.unauthNewLogDict?.['logNote']);
    const logUnitTypeId = formatNumber(authLog.unauthNewLogDict?.['logUnitTypeId']);
    const logNumberOfLogUnits = formatNumber(authLog.unauthNewLogDict?.['logNumberOfLogUnits']);
    const logCreatedByReminderUUID = formatUnknownString(authLog.unauthNewLogDict?.['logCreatedByReminderUUID']);
    const rawLikedByUserIds = formatArray(authLog.unauthNewLogDict?.['logLikedByUserIds']);
    const logLikedByUserIds = rawLikedByUserIds !== undefined
      ? rawLikedByUserIds.map((id) => formatUnknownString(id) ?? '').filter((id) => id !== '')
      : [];

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
        dogUUID: authLog.authLog.dogUUID,
        logId: authLog.authLog.logId,
        logUUID: authLog.authLog.logUUID,
        logStartDate,
        logEndDate,
        logActionTypeId,
        logCustomActionName,
        logNote,
        logUnitTypeId,
        logNumberOfLogUnits,
        logCreatedByReminderUUID,
        logLastModifiedBy: authUserId,
        logLikedByUserIds,
      },
    );

    const oldLikeUserIds = authLog.authLog.logLikedByUserIds;
    const newLikeUserIds = logLikedByUserIds;

    const addedLikeUserIds = newLikeUserIds.filter((id) => !oldLikeUserIds.includes(id));

    await Promise.all(
      addedLikeUserIds.map((addedLikeUserId) => createLogLikeNotification(
        databaseConnection,
        addedLikeUserId,
        authLog.authLog.dogUUID,
        authLog.authLog.logUUID,
      )),
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
    const { authLogs, authUserId } = req.houndProperties.authenticated;
    const authLog = authLogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteLog, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteLog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authLog === undefined || authLog === null) {
      throw new HoundError('authLog missing', deleteLog, ERROR_CODES.VALUE.MISSING);
    }

    await deleteLogForLogUUID(databaseConnection, authLog.authLog.logUUID, authUserId);

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
