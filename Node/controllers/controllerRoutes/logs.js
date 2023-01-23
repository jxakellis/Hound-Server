const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { createLogNotification } = require('../../main/tools/notifications/alert/createLogNotification');

const { getLogForLogId, getAllLogsForDogId } = require('../getFor/getForLogs');

const { createLogForUserIdDogId } = require('../createFor/createForLogs');

const { updateLogForDogIdLogId } = require('../updateFor/updateForLogs');

const { deleteLogForLogId } = require('../deleteFor/deleteForLogs');

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) logId formatted correctly and request has sufficient permissions to use
*/
async function getLogs(req, res) {
  try {
    const { dogId, logId } = req.params;
    const { userConfigurationPreviousDogManagerSynchronization } = req.query;
    const result = areAllDefined(logId)
    // if logId is defined and it is a number then continue to find a single log
      ? await getLogForLogId(req.databaseConnection, logId, userConfigurationPreviousDogManagerSynchronization)
    // query for multiple logs
      : await getAllLogsForDogId(req.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization);

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function createLog(req, res) {
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

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function updateLog(req, res) {
  try {
    const { dogId, logId } = req.params;
    const {
      logDate, logAction, logCustomActionName, logNote,
    } = req.body;
    await updateLogForDogIdLogId(req.databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, logNote);
    return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function deleteLog(req, res) {
  try {
    const { dogId, logId } = req.params;
    await deleteLogForLogId(req.databaseConnection, dogId, logId);
    return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

module.exports = {
  getLogs, createLog, updateLog, deleteLog,
};
