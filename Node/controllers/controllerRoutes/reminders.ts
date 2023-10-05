import express from 'express';
const { formatArray } from '../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { createAlarmNotificationForFamily } from '../../main/tools/notifications/alarm/createAlarmNotification';

const { getReminderForReminderId, getAllRemindersForDogId } from '../getFor/getForReminders';

const { createReminderForDogIdReminder, createRemindersForDogIdReminders } from '../createFor/createForReminders';

const { updateReminderForDogIdReminder, updateRemindersForDogIdReminders } from '../updateFor/updateForReminders';

const { deleteReminderForFamilyIdDogIdReminderId, deleteRemindersForFamilyIdDogIdReminderIds } from '../deleteFor/deleteForReminders';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminderId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminders is an array with reminderId that are formatted correctly and request has sufficient permissions to use
*/

async function getReminders(req: express.Request, res: express.Response) {
  try {
    const { dogId, reminderId } = req.params;
    const { userConfigurationPreviousDogManagerSynchronization } = req.query;

    const result = areAllDefined(reminderId)
    // reminderId was provided, look for single reminder
      ? await getReminderForReminderId(req.databaseConnection, reminderId, userConfigurationPreviousDogManagerSynchronization)
    // look for multiple reminders
      : await getAllRemindersForDogId(req.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createReminder(req: express.Request, res: express.Response) {
  try {
    const { familyId, dogId } = req.params;
    const reminder = req.body;
    const reminders = formatArray(req.body.reminders);
    const result = areAllDefined(reminders)
      ? await createRemindersForDogIdReminders(req.databaseConnection, dogId, reminders)
      : await createReminderForDogIdReminder(req.databaseConnection, dogId, reminder);

    // create was successful, so we can create all the alarm notifications
    for (let i = 0; i < result.length; i += 1) {
      createAlarmNotificationForFamily(
        familyId,
        result[i].reminderId,
        result[i].reminderExecutionDate,
      );
    }

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function updateReminder(req: express.Request, res: express.Response) {
  try {
    const { familyId, dogId } = req.params;
    const reminder = req.body;
    const reminders = formatArray(req.body.reminders);

    const result = areAllDefined(reminders)
      ? await updateRemindersForDogIdReminders(req.databaseConnection, dogId, reminders)
      : await updateReminderForDogIdReminder(req.databaseConnection, dogId, reminder);

    // update was successful, so we can create all new alarm notifications
    for (let i = 0; i < result.length; i += 1) {
      createAlarmNotificationForFamily(
        familyId,
        result[i].reminderId,
        result[i].reminderExecutionDate,
      );
    }
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function deleteReminder(req: express.Request, res: express.Response) {
  try {
    const { familyId, dogId } = req.params;
    const { reminderId } = req.body;
    const reminders = formatArray(req.body.reminders);

    // reminders array
    if (areAllDefined(reminders)) {
      await deleteRemindersForFamilyIdDogIdReminderIds(req.databaseConnection, familyId, dogId, reminders);
    }
    // single reminder
    else {
      await deleteReminderForFamilyIdDogIdReminderId(req.databaseConnection, familyId, dogId, reminderId);
    }

    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};