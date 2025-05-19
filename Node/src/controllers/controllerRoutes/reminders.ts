import express from 'express';
import { createAlarmNotificationForFamily } from '../../main/tools/notifications/alarm/createAlarmNotification.js';

import { getReminderForReminderUUID, getAllRemindersForDogUUID } from '../get/getReminders.js';

import { createRemindersForReminders } from '../create/createReminders.js';

import { updateRemindersForReminders } from '../update/updateReminders.js';

import { deleteRemindersForFamilyIdReminderUUIDs } from '../delete/deleteReminders.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import {
  formatDate, formatNumber, formatUnknownString,
} from '../../main/format/formatObject.js';
import { formatReminderActionToInternalValue } from '../../main/format/formatReminderAction.js';
import { type NotYetCreatedDogRemindersRow, type NotYetUpdatedDogRemindersRow } from '../../main/types/DogRemindersRow.js';

async function getReminders(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getReminders, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', getReminders, ERROR_CODES.VALUE.MISSING);
    }

    const { validatedReminders } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedReminder = validatedReminders.safeIndex(0);

    if (validatedReminder !== undefined && validatedReminder !== null) {
      const possibleDeletedReminder = await getReminderForReminderUUID(databaseConnection, validatedReminder.validatedReminderUUID, true);

      if (possibleDeletedReminder === undefined || possibleDeletedReminder === null) {
        throw new HoundError('getReminderForReminderUUID possibleDeletedReminder missing', getReminders, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndDeclarationExtendedProperties.sendSuccessResponse(possibleDeletedReminder);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedReminders = await getAllRemindersForDogUUID(databaseConnection, validatedDog.validatedDogUUID, true, previousDogManagerSynchronization);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(possibleDeletedReminders);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    const { unvalidatedRemindersDictionary } = req.houndDeclarationExtendedProperties.unvalidatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (unvalidatedRemindersDictionary === undefined || unvalidatedRemindersDictionary === null) {
      throw new HoundError('unvalidatedRemindersDictionary missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }

    const reminders: NotYetCreatedDogRemindersRow[] = [];
    unvalidatedRemindersDictionary.forEach((unvalidatedReminderDictionary) => {
      const reminderUUID = formatUnknownString(unvalidatedReminderDictionary['reminderUUID'], 36);
      const reminderAction = formatReminderActionToInternalValue(formatUnknownString(unvalidatedReminderDictionary['reminderAction']));
      const reminderCustomActionName = formatUnknownString(unvalidatedReminderDictionary['reminderCustomActionName']);
      const reminderType = formatUnknownString(unvalidatedReminderDictionary['reminderType']);
      const reminderIsEnabled = formatNumber(unvalidatedReminderDictionary['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(unvalidatedReminderDictionary['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(unvalidatedReminderDictionary['reminderExecutionDate']);
      const snoozeExecutionInterval = formatNumber(unvalidatedReminderDictionary['snoozeExecutionInterval']);
      const countdownExecutionInterval = formatNumber(unvalidatedReminderDictionary['countdownExecutionInterval']);
      const weeklyUTCHour = formatNumber(unvalidatedReminderDictionary['weeklyUTCHour']);
      const weeklyUTCMinute = formatNumber(unvalidatedReminderDictionary['weeklyUTCMinute']);
      const weeklySunday = formatNumber(unvalidatedReminderDictionary['weeklySunday']);
      const weeklyMonday = formatNumber(unvalidatedReminderDictionary['weeklyMonday']);
      const weeklyTuesday = formatNumber(unvalidatedReminderDictionary['weeklyTuesday']);
      const weeklyWednesday = formatNumber(unvalidatedReminderDictionary['weeklyWednesday']);
      const weeklyThursday = formatNumber(unvalidatedReminderDictionary['weeklyThursday']);
      const weeklyFriday = formatNumber(unvalidatedReminderDictionary['weeklyFriday']);
      const weeklySaturday = formatNumber(unvalidatedReminderDictionary['weeklySaturday']);
      const weeklySkippedDate = formatDate(unvalidatedReminderDictionary['weeklySkippedDate']);

      const monthlyUTCDay = formatNumber(unvalidatedReminderDictionary['monthlyUTCDay']);
      const monthlyUTCHour = formatNumber(unvalidatedReminderDictionary['monthlyUTCHour']);
      const monthlyUTCMinute = formatNumber(unvalidatedReminderDictionary['monthlyUTCMinute']);
      const monthlySkippedDate = formatDate(unvalidatedReminderDictionary['monthlySkippedDate']);

      const oneTimeDate = formatDate(unvalidatedReminderDictionary['oneTimeDate']);

      if (reminderUUID === undefined || reminderUUID === null) {
        throw new HoundError('reminderUUID missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderAction === undefined || reminderAction === null) {
        throw new HoundError('reminderAction missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined || reminderCustomActionName === null) {
        throw new HoundError('reminderCustomActionName missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderType === undefined || reminderType === null) {
        throw new HoundError('reminderType missing', createReminder, ERROR_CODES.VALUE.MISSING);
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
        reminderAction,
        reminderCustomActionName,
        reminderType,
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

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(results);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedReminders } = req.houndDeclarationExtendedProperties.validatedVariables;
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
    validatedReminders.forEach((validatedReminder) => {
      // validate reminder id against validatedReminders
      const reminderId = validatedReminder.validatedReminderId;
      const reminderUUID = validatedReminder.validatedReminderUUID;
      const dogUUID = validatedReminder.validatedDogUUID;
      const reminderAction = formatReminderActionToInternalValue(formatUnknownString(validatedReminder.unvalidatedReminderDictionary?.['reminderAction']));
      const reminderCustomActionName = formatUnknownString(validatedReminder.unvalidatedReminderDictionary?.['reminderCustomActionName']);
      const reminderType = formatUnknownString(validatedReminder.unvalidatedReminderDictionary?.['reminderType']);
      const reminderIsEnabled = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(validatedReminder.unvalidatedReminderDictionary?.['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(validatedReminder.unvalidatedReminderDictionary?.['reminderExecutionDate']);
      const snoozeExecutionInterval = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['snoozeExecutionInterval']);
      const countdownExecutionInterval = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['countdownExecutionInterval']);
      const weeklyUTCHour = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyUTCHour']);
      const weeklyUTCMinute = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyUTCMinute']);
      const weeklySunday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklySunday']);
      const weeklyMonday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyMonday']);
      const weeklyTuesday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyTuesday']);
      const weeklyWednesday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyWednesday']);
      const weeklyThursday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyThursday']);
      const weeklyFriday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklyFriday']);
      const weeklySaturday = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['weeklySaturday']);
      const weeklySkippedDate = formatDate(validatedReminder.unvalidatedReminderDictionary?.['weeklySkippedDate']);

      const monthlyUTCDay = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['monthlyUTCDay']);
      const monthlyUTCHour = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['monthlyUTCHour']);
      const monthlyUTCMinute = formatNumber(validatedReminder.unvalidatedReminderDictionary?.['monthlyUTCMinute']);
      const monthlySkippedDate = formatDate(validatedReminder.unvalidatedReminderDictionary?.['monthlySkippedDate']);

      const oneTimeDate = formatDate(validatedReminder.unvalidatedReminderDictionary?.['oneTimeDate']);

      if (reminderAction === undefined || reminderAction === null) {
        throw new HoundError('reminderAction missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined || reminderCustomActionName === null) {
        throw new HoundError('reminderCustomActionName missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderType === undefined || reminderType === null) {
        throw new HoundError('reminderType missing', updateReminder, ERROR_CODES.VALUE.MISSING);
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
        reminderAction,
        reminderCustomActionName,
        reminderType,
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

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedReminders } = req.houndDeclarationExtendedProperties.validatedVariables;
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

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};
