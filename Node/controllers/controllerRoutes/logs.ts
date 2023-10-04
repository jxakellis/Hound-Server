import express from 'express';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { createLogNotification } from '../../main/tools/notifications/alert/createLogNotification';

const { getLogForLogId, getAllLogsForDogId } from '../getFor/getForLogs';

const { createLogForUserIdDogId } from '../createFor/createForLogs';

const { updateLogForDogIdLogId } from '../updateFor/updateForLogs';

const { deleteLogForLogId } from '../deleteFor/deleteForLogs';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) logId formatted correctly and request has sufficient permissions to use
*/
async function getLogs(req: express.Request, res: express.Response) {
  try {
    const { dogId, logId } = req.params;
    const { userConfigurationPreviousDogManagerSynchronization } = req.query;
    const result = areAllDefined(logId)
    // if logId is defined and it is a number then continue to find a single log
      ? await getLogForLogId(req.databaseConnection, logId, userConfigurationPreviousDogManagerSynchronization)
    // query for multiple logs
      : await getAllLogsForDogId(req.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createLog(req: express.Request, res: express.Response) {
  try {
    const { userId, familyId, dogId } = req.params;
    const {
      logDate, logAction, logCustomActionName, logNote,
    } = req.body;
    const result = await createLogForUserIdDogId(req.databaseConnection, userId, dogId, logDate, logAction, logCustomActionName, logNote);
    createLogNotification(
      userId,
      familyId,
      dogId,
      logAction,
      logCustomActionName,
    );

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function updateLog(req: express.Request, res: express.Response) {
  try {
    const { dogId, logId } = req.params;
    const {
      logDate, logAction, logCustomActionName, logNote,
    } = req.body;
    await updateLogForDogIdLogId(req.databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, logNote);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function deleteLog(req: express.Request, res: express.Response) {
  try {
    const { dogId, logId } = req.params;
    await deleteLogForLogId(req.databaseConnection, dogId, logId);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

export {
  getLogs, createLog, updateLog, deleteLog,
};
