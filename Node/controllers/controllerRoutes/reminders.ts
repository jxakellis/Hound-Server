import express from 'express';
import { createAlarmNotificationForFamily } from '../../main/tools/notifications/alarm/createAlarmNotification';

import { getReminderForReminderId, getAllRemindersForDogId } from '../getFor/getForReminders';

import { createReminderForDogIdReminder, createRemindersForDogIdReminders } from '../createFor/createForReminders';

import { updateReminderForDogIdReminder, updateRemindersForDogIdReminders } from '../updateFor/updateForReminders';

import { deleteReminderForFamilyIdDogIdReminderId, deleteRemindersForFamilyIdDogIdReminderIds } from '../deleteFor/deleteForReminders';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminderId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminders is an array with reminderId that are formatted correctly and request has sufficient permissions to use
*/

async function getReminders(req: express.Request, res: express.Response) {
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

    const { dogId, reminderId } = req.extendedProperties.validatedVariables;
    const { userConfigurationPreviousDogManagerSynchronization } = req.query;

    const result = areAllDefined(reminderId)
    // reminderId was provided, look for single reminder
      ? await getReminderForReminderId(req.extendedProperties.databaseConnection, reminderId, userConfigurationPreviousDogManagerSynchronization)
    // look for multiple reminders
      : await getAllRemindersForDogId(req.extendedProperties.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createReminder(req: express.Request, res: express.Response) {
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

    const { familyId, dogId } = req.extendedProperties.validatedVariables;
    const reminder = req.body;
    const reminders = formatArray(req.body.reminders);
    const result = areAllDefined(reminders)
      ? await createRemindersForDogIdReminders(req.extendedProperties.databaseConnection, dogId, reminders)
      : await createReminderForDogIdReminder(req.extendedProperties.databaseConnection, dogId, reminder);

    // create was successful, so we can create all the alarm notifications
    for (let i = 0; i < result.length; i += 1) {
      createAlarmNotificationForFamily(
        familyId,
        result[i].reminderId,
        result[i].reminderExecutionDate,
      );
    }

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function updateReminder(req: express.Request, res: express.Response) {
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

    const { familyId, dogId } = req.extendedProperties.validatedVariables;
    const reminder = req.body;
    const reminders = formatArray(req.body.reminders);

    const result = areAllDefined(reminders)
      ? await updateRemindersForDogIdReminders(req.extendedProperties.databaseConnection, dogId, reminders)
      : await updateReminderForDogIdReminder(req.extendedProperties.databaseConnection, dogId, reminder);

    // update was successful, so we can create all new alarm notifications
    for (let i = 0; i < result.length; i += 1) {
      createAlarmNotificationForFamily(
        familyId,
        result[i].reminderId,
        result[i].reminderExecutionDate,
      );
    }
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function deleteReminder(req: express.Request, res: express.Response) {
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

    const { familyId, dogId } = req.extendedProperties.validatedVariables;
    const { reminderId } = req.body;
    const reminders = formatArray(req.body.reminders);

    // reminders array
    if (areAllDefined(reminders)) {
      await deleteRemindersForFamilyIdDogIdReminderIds(req.extendedProperties.databaseConnection, familyId, dogId, reminders);
    }
    // single reminder
    else {
      await deleteReminderForFamilyIdDogIdReminderId(req.extendedProperties.databaseConnection, familyId, dogId, reminderId);
    }

    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};
