import express from 'express';
import { createLogNotification } from '../../main/tools/notifications/alert/createLogNotification';

import { getLogForLogId, getAllLogsForDogId } from '../getFor/getForLogs';

import { createLogForUserIdDogId } from '../createFor/createForLogs';

import { updateLogForDogIdLogId } from '../updateFor/updateForLogs';

import { deleteLogForLogId } from '../deleteFor/deleteForLogs';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) logId formatted correctly and request has sufficient permissions to use
*/
async function getLogs(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { dogId, logId } = req.extendedProperties.validatedVariables;
    const { userConfigurationPreviousDogManagerSynchronization } = req.query;
    const result = areAllDefined(logId)
    // if logId is defined and it is a number then continue to find a single log
      ? await getLogForLogId(req.extendedProperties.databaseConnection, logId, userConfigurationPreviousDogManagerSynchronization)
    // query for multiple logs
      : await getAllLogsForDogId(req.extendedProperties.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createLog(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId, familyId, dogId } = req.extendedProperties.validatedVariables;
    const {
      logDate, logAction, logCustomActionName, logNote,
    } = req.body;
    const result = await createLogForUserIdDogId(req.extendedProperties.databaseConnection, userId, dogId, logDate, logAction, logCustomActionName, logNote);
    createLogNotification(
      userId,
      familyId,
      dogId,
      logAction,
      logCustomActionName,
    );

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function updateLog(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { dogId, logId } = req.extendedProperties.validatedVariables;
    const {
      logDate, logAction, logCustomActionName, logNote,
    } = req.body;
    await updateLogForDogIdLogId(req.extendedProperties.databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, logNote);
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function deleteLog(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { dogId, logId } = req.extendedProperties.validatedVariables;
    await deleteLogForLogId(req.extendedProperties.databaseConnection, dogId, logId);
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
