import express from 'express';
import { createAlarmNotificationForFamily } from '../../../../../../main/tools/notifications/alarm/createAlarmNotification.js';

import { getReminderForReminderUUID, getAllRemindersForDogUUID } from '../../../../../get/getReminders.js';

import { createRemindersForReminders } from '../../../../../create/createReminders.js';

import { updateRemindersForReminders } from '../../../../../update/updateReminders.js';

import { deleteRemindersForFamilyIdReminderUUIDs } from '../../../../../delete/deleteReminders.js';
import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import {
  formatDate, formatNumber, formatUnknownString,
} from '../../../../../../main/format/formatObject.js';
import { type NotYetCreatedDogRemindersRow, type NotYetUpdatedDogRemindersRow } from '../../../../../../main/types/rows/DogRemindersRow.js';
import { getAllReminderActionTypes } from '../../../../../../controllers/get/types/getReminderActionType.js';

async function getReminders(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getReminders, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', getReminders, ERROR_CODES.VALUE.MISSING);
    }

    const { validatedReminders } = req.houndProperties.validatedVars;
    const validatedReminder = validatedReminders.safeIndex(0);

    if (validatedReminder !== undefined && validatedReminder !== null) {
      const possibleDeletedReminder = await getReminderForReminderUUID(databaseConnection, validatedReminder.validatedReminderUUID, true);

      if (possibleDeletedReminder === undefined || possibleDeletedReminder === null) {
        throw new HoundError('getReminderForReminderUUID possibleDeletedReminder missing', getReminders, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possibleDeletedReminder);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedReminders = await getAllRemindersForDogUUID(databaseConnection, validatedDog.validatedDogUUID, true, previousDogManagerSynchronization);

    return res.houndProperties.sendSuccessResponse(possibleDeletedReminders);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    const { unvalidatedRemindersDict } = req.houndProperties.unvalidatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (unvalidatedRemindersDict === undefined || unvalidatedRemindersDict === null) {
      throw new HoundError('unvalidatedRemindersDict missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }

    const reminders: NotYetCreatedDogRemindersRow[] = [];
    const reminderActionTypes = await getAllReminderActionTypes(databaseConnection);
    unvalidatedRemindersDict.forEach((unvalidatedReminderDict) => {
      const reminderUUID = formatUnknownString(unvalidatedReminderDict['reminderUUID'], 36);
      // TODO FUTURE DEPRECIATE this is compatibility for <= 3.5.0
      const depreciatedReminderAction = formatUnknownString(unvalidatedReminderDict['reminderAction']);
      const reminderActionTypeId = formatNumber(unvalidatedReminderDict['reminderActionTypeId'])
      ?? reminderActionTypes.find((rat) => rat.internalValue === depreciatedReminderAction)?.reminderActionTypeId;
      const reminderCustomActionName = formatUnknownString(unvalidatedReminderDict['reminderCustomActionName']);
      const reminderType = formatUnknownString(unvalidatedReminderDict['reminderType']);
      const reminderIsTriggerResult = formatNumber(unvalidatedReminderDict['reminderIsTriggerResult']);
      const reminderIsEnabled = formatNumber(unvalidatedReminderDict['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(unvalidatedReminderDict['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(unvalidatedReminderDict['reminderExecutionDate']);
      const snoozeExecutionInterval = formatNumber(unvalidatedReminderDict['snoozeExecutionInterval']);
      const countdownExecutionInterval = formatNumber(unvalidatedReminderDict['countdownExecutionInterval']);
      const weeklyUTCHour = formatNumber(unvalidatedReminderDict['weeklyUTCHour']);
      const weeklyUTCMinute = formatNumber(unvalidatedReminderDict['weeklyUTCMinute']);
      const weeklySunday = formatNumber(unvalidatedReminderDict['weeklySunday']);
      const weeklyMonday = formatNumber(unvalidatedReminderDict['weeklyMonday']);
      const weeklyTuesday = formatNumber(unvalidatedReminderDict['weeklyTuesday']);
      const weeklyWednesday = formatNumber(unvalidatedReminderDict['weeklyWednesday']);
      const weeklyThursday = formatNumber(unvalidatedReminderDict['weeklyThursday']);
      const weeklyFriday = formatNumber(unvalidatedReminderDict['weeklyFriday']);
      const weeklySaturday = formatNumber(unvalidatedReminderDict['weeklySaturday']);
      const weeklySkippedDate = formatDate(unvalidatedReminderDict['weeklySkippedDate']);

      const monthlyUTCDay = formatNumber(unvalidatedReminderDict['monthlyUTCDay']);
      const monthlyUTCHour = formatNumber(unvalidatedReminderDict['monthlyUTCHour']);
      const monthlyUTCMinute = formatNumber(unvalidatedReminderDict['monthlyUTCMinute']);
      const monthlySkippedDate = formatDate(unvalidatedReminderDict['monthlySkippedDate']);

      const oneTimeDate = formatDate(unvalidatedReminderDict['oneTimeDate']);

      if (reminderUUID === undefined || reminderUUID === null) {
        throw new HoundError('reminderUUID missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderActionTypeId === undefined || reminderActionTypeId === null) {
        throw new HoundError('reminderActionTypeId missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined || reminderCustomActionName === null) {
        throw new HoundError('reminderCustomActionName missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderType === undefined || reminderType === null) {
        throw new HoundError('reminderType missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderIsTriggerResult === undefined || reminderIsTriggerResult === null) {
        throw new HoundError('reminderIsTriggerResult missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderIsEnabled === undefined || reminderIsEnabled === null) {
        throw new HoundError('reminderIsEnabled missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // reminderExecutionDate optional
      if (reminderExecutionBasis === undefined || reminderExecutionBasis === null) {
        throw new HoundError('reminderExecutionBasis missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // snoozeExecutionInterval optional
      if (countdownExecutionInterval === undefined || countdownExecutionInterval === null) {
        throw new HoundError('countdownExecutionInterval missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCHour === undefined || weeklyUTCHour === null) {
        throw new HoundError('weeklyUTCHour missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCMinute === undefined || weeklyUTCMinute === null) {
        throw new HoundError('weeklyUTCMinute missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySunday === undefined || weeklySunday === null) {
        throw new HoundError('weeklySunday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyMonday === undefined || weeklyMonday === null) {
        throw new HoundError('weeklyMonday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyTuesday === undefined || weeklyTuesday === null) {
        throw new HoundError('weeklyTuesday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyWednesday === undefined || weeklyWednesday === null) {
        throw new HoundError('weeklyWednesday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyThursday === undefined || weeklyThursday === null) {
        throw new HoundError('weeklyThursday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyFriday === undefined || weeklyFriday === null) {
        throw new HoundError('weeklyFriday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySaturday === undefined || weeklySaturday === null) {
        throw new HoundError('weeklySaturday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // weeklySkippedDate optional
      if (monthlyUTCDay === undefined || monthlyUTCDay === null) {
        throw new HoundError('monthlyUTCDay missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCHour === undefined || monthlyUTCHour === null) {
        throw new HoundError('monthlyUTCHour missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCMinute === undefined || monthlyUTCMinute === null) {
        throw new HoundError('monthlyUTCMinute missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // monthlySkippedDate optional
      if (oneTimeDate === undefined || oneTimeDate === null) {
        throw new HoundError('oneTimeDate missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }

      reminders.push({
        dogUUID: validatedDog.validatedDogUUID,
        reminderUUID,
        reminderActionTypeId,
        reminderCustomActionName,
        reminderType,
        reminderIsTriggerResult,
        reminderIsEnabled,
        reminderExecutionBasis,
        reminderExecutionDate,
        snoozeExecutionInterval,
        countdownExecutionInterval,
        weeklyUTCHour,
        weeklyUTCMinute,
        weeklySunday,
        weeklyMonday,
        weeklyTuesday,
        weeklyWednesday,
        weeklyThursday,
        weeklyFriday,
        weeklySaturday,
        weeklySkippedDate,
        monthlyUTCDay,
        monthlyUTCHour,
        monthlyUTCMinute,
        monthlySkippedDate,
        oneTimeDate,
      });
    });

    const results = await createRemindersForReminders(databaseConnection, reminders);

    // create was successful, so we can create all the alarm notifications
    results.forEach((result) => {
      createAlarmNotificationForFamily(
        validatedFamilyId,
        result.reminderUUID,
        result.reminderExecutionDate,
      );
    });

    return res.houndProperties.sendSuccessResponse(results);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function updateReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedReminders } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedReminders === undefined || validatedReminders === null) {
      throw new HoundError('validatedReminders missing', updateReminder, ERROR_CODES.VALUE.MISSING);
    }

    const reminders: NotYetUpdatedDogRemindersRow[] = [];
    const reminderActionTypes = await getAllReminderActionTypes(databaseConnection);
    validatedReminders.forEach((validatedReminder) => {
      // validate reminder id against validatedReminders
      const reminderId = validatedReminder.validatedReminderId;
      const reminderUUID = validatedReminder.validatedReminderUUID;
      const dogUUID = validatedReminder.validatedDogUUID;
      // TODO FUTURE DEPRECIATE this is compatibility for <= 3.5.0
      const depreciatedReminderAction = formatUnknownString(validatedReminder.unvalidatedReminderDict?.['reminderAction']);
      const reminderActionTypeId = formatNumber(validatedReminder.unvalidatedReminderDict?.['reminderActionTypeId'])
      ?? reminderActionTypes.find((rat) => rat.internalValue === depreciatedReminderAction)?.reminderActionTypeId;
      const reminderCustomActionName = formatUnknownString(validatedReminder.unvalidatedReminderDict?.['reminderCustomActionName']);
      const reminderType = formatUnknownString(validatedReminder.unvalidatedReminderDict?.['reminderType']);
      const reminderIsTriggerResult = formatNumber(validatedReminder.unvalidatedReminderDict?.['reminderIsTriggerResult']);
      const reminderIsEnabled = formatNumber(validatedReminder.unvalidatedReminderDict?.['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(validatedReminder.unvalidatedReminderDict?.['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(validatedReminder.unvalidatedReminderDict?.['reminderExecutionDate']);
      const snoozeExecutionInterval = formatNumber(validatedReminder.unvalidatedReminderDict?.['snoozeExecutionInterval']);
      const countdownExecutionInterval = formatNumber(validatedReminder.unvalidatedReminderDict?.['countdownExecutionInterval']);
      const weeklyUTCHour = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyUTCHour']);
      const weeklyUTCMinute = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyUTCMinute']);
      const weeklySunday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklySunday']);
      const weeklyMonday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyMonday']);
      const weeklyTuesday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyTuesday']);
      const weeklyWednesday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyWednesday']);
      const weeklyThursday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyThursday']);
      const weeklyFriday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyFriday']);
      const weeklySaturday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklySaturday']);
      const weeklySkippedDate = formatDate(validatedReminder.unvalidatedReminderDict?.['weeklySkippedDate']);

      const monthlyUTCDay = formatNumber(validatedReminder.unvalidatedReminderDict?.['monthlyUTCDay']);
      const monthlyUTCHour = formatNumber(validatedReminder.unvalidatedReminderDict?.['monthlyUTCHour']);
      const monthlyUTCMinute = formatNumber(validatedReminder.unvalidatedReminderDict?.['monthlyUTCMinute']);
      const monthlySkippedDate = formatDate(validatedReminder.unvalidatedReminderDict?.['monthlySkippedDate']);

      const oneTimeDate = formatDate(validatedReminder.unvalidatedReminderDict?.['oneTimeDate']);

      if (reminderActionTypeId === undefined || reminderActionTypeId === null) {
        throw new HoundError('reminderActionTypeId missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined || reminderCustomActionName === null) {
        throw new HoundError('reminderCustomActionName missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderType === undefined || reminderType === null) {
        throw new HoundError('reminderType missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderIsTriggerResult === undefined || reminderIsTriggerResult === null) {
        throw new HoundError('reminderIsTriggerResult missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderIsEnabled === undefined || reminderIsEnabled === null) {
        throw new HoundError('reminderIsEnabled missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // reminderExecutionDate optional
      if (reminderExecutionBasis === undefined || reminderExecutionBasis === null) {
        throw new HoundError('reminderExecutionBasis missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // snoozeExecutionInterval optional
      if (countdownExecutionInterval === undefined || countdownExecutionInterval === null) {
        throw new HoundError('countdownExecutionInterval missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCHour === undefined || weeklyUTCHour === null) {
        throw new HoundError('weeklyUTCHour missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCMinute === undefined || weeklyUTCMinute === null) {
        throw new HoundError('weeklyUTCMinute missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySunday === undefined || weeklySunday === null) {
        throw new HoundError('weeklySunday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyMonday === undefined || weeklyMonday === null) {
        throw new HoundError('weeklyMonday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyTuesday === undefined || weeklyTuesday === null) {
        throw new HoundError('weeklyTuesday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyWednesday === undefined || weeklyWednesday === null) {
        throw new HoundError('weeklyWednesday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyThursday === undefined || weeklyThursday === null) {
        throw new HoundError('weeklyThursday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyFriday === undefined || weeklyFriday === null) {
        throw new HoundError('weeklyFriday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySaturday === undefined || weeklySaturday === null) {
        throw new HoundError('weeklySaturday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // weeklySkippedDate optional
      if (monthlyUTCDay === undefined || monthlyUTCDay === null) {
        throw new HoundError('monthlyUTCDay missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCHour === undefined || monthlyUTCHour === null) {
        throw new HoundError('monthlyUTCHour missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCMinute === undefined || monthlyUTCMinute === null) {
        throw new HoundError('monthlyUTCMinute missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // monthlySkippedDate optional
      if (oneTimeDate === undefined || oneTimeDate === null) {
        throw new HoundError('oneTimeDate missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }

      reminders.push({
        reminderId,
        reminderUUID,
        dogUUID,
        reminderActionTypeId,
        reminderCustomActionName,
        reminderType,
        reminderIsTriggerResult,
        reminderIsEnabled,
        reminderExecutionBasis,
        reminderExecutionDate,
        snoozeExecutionInterval,
        countdownExecutionInterval,
        weeklyUTCHour,
        weeklyUTCMinute,
        weeklySunday,
        weeklyMonday,
        weeklyTuesday,
        weeklyWednesday,
        weeklyThursday,
        weeklyFriday,
        weeklySaturday,
        weeklySkippedDate,
        monthlyUTCDay,
        monthlyUTCHour,
        monthlyUTCMinute,
        monthlySkippedDate,
        oneTimeDate,
      });
    });

    await updateRemindersForReminders(databaseConnection, reminders);

    // update was successful, so we can create all new alarm notifications
    reminders.forEach((reminder) => {
      createAlarmNotificationForFamily(
        validatedFamilyId,
        reminder.reminderUUID,
        reminder.reminderExecutionDate,
      );
    });

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function deleteReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedReminders } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedReminders === undefined || validatedReminders === null) {
      throw new HoundError('validatedReminders missing', deleteReminder, ERROR_CODES.VALUE.MISSING);
    }

    await deleteRemindersForFamilyIdReminderUUIDs(databaseConnection, validatedFamilyId, validatedReminders.map((validatedReminder) => validatedReminder.validatedReminderUUID));

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};
