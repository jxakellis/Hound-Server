import express from 'express';
import { createAlarmNotificationForFamily } from '../../main/tools/notifications/alarm/createAlarmNotification.js';

import { getReminderForReminderId, getAllRemindersForDogId } from '../getFor/getForReminders.js';

import { createRemindersForDogIdReminders } from '../createFor/createForReminders.js';

import { updateRemindersForDogIdReminders } from '../updateFor/updateForReminders.js';

import { deleteRemindersForFamilyIdDogIdReminderIds } from '../deleteFor/deleteForReminders.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import {
  formatArray, formatDate, formatNumber, formatUnknownString,
} from '../../main/format/formatObject.js';
import { type Dictionary } from '../../main/types/Dictionary.js';
import { type NotYetCreatedDogRemindersRow, type NotYetUpdatedDogRemindersRow } from '../../main/types/DogRemindersRow.js';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminderId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminders is an array with reminderId that are formatted correctly and request has sufficient permissions to use
*/

async function getReminders(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDogId = validatedDogIds.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getReminders, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', getReminders, ERROR_CODES.VALUE.INVALID);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const { validatedReminderIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedReminderId = validatedReminderIds.safeIndex(0);
    if (validatedReminderId !== undefined && validatedReminderId !== null) {
      const result = await getReminderForReminderId(databaseConnection, validatedReminderId, previousDogManagerSynchronization);

      if (result === undefined || result === null) {
        throw new HoundError('result missing', getReminders, ERROR_CODES.VALUE.INVALID);
      }

      return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
    }

    const result = await getAllRemindersForDogId(databaseConnection, validatedDogId, previousDogManagerSynchronization);
    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDogId = validatedDogIds.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (Dictionary[] | undefined);
    if (remindersDictionary === undefined || remindersDictionary === null) {
      throw new HoundError('remindersDictionary missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }

    const reminders: NotYetCreatedDogRemindersRow[] = [];
    remindersDictionary.forEach((reminder) => {
      const reminderAction = formatUnknownString(reminder['reminderAction']);
      const reminderCustomActionName = formatUnknownString(reminder['reminderCustomActionName']);
      const reminderType = formatUnknownString(reminder['reminderType']);
      const reminderIsEnabled = formatNumber(reminder['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(reminder['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(reminder['reminderExecutionDate']);
      const snoozeExecutionInterval = formatNumber(reminder['snoozeExecutionInterval']);
      const countdownExecutionInterval = formatNumber(reminder['countdownExecutionInterval']);
      const weeklyUTCHour = formatNumber(reminder['weeklyUTCHour']);
      const weeklyUTCMinute = formatNumber(reminder['weeklyUTCMinute']);
      const weeklySunday = formatNumber(reminder['weeklySunday']);
      const weeklyMonday = formatNumber(reminder['weeklyMonday']);
      const weeklyTuesday = formatNumber(reminder['weeklyTuesday']);
      const weeklyWednesday = formatNumber(reminder['weeklyWednesday']);
      const weeklyThursday = formatNumber(reminder['weeklyThursday']);
      const weeklyFriday = formatNumber(reminder['weeklyFriday']);
      const weeklySaturday = formatNumber(reminder['weeklySaturday']);
      const weeklySkippedDate = formatDate(reminder['weeklySkippedDate']);

      const monthlyUTCDay = formatNumber(reminder['monthlyUTCDay']);
      const monthlyUTCHour = formatNumber(reminder['monthlyUTCHour']);
      const monthlyUTCMinute = formatNumber(reminder['monthlyUTCMinute']);
      const monthlySkippedDate = formatDate(reminder['monthlySkippedDate']);

      const oneTimeDate = formatDate(reminder['oneTimeDate']);

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
        dogId: validatedDogId,
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

    const results = await createRemindersForDogIdReminders(databaseConnection, reminders);

    // create was successful, so we can create all the alarm notifications
    results.forEach((result) => {
      createAlarmNotificationForFamily(
        validatedFamilyId,
        result.reminderId,
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
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDogId = validatedDogIds.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (Dictionary[] | undefined);
    if (remindersDictionary === undefined || remindersDictionary === null) {
      throw new HoundError('remindersDictionary missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }

    const reminders: NotYetUpdatedDogRemindersRow[] = [];
    remindersDictionary.forEach((reminder) => {
      // validate reminder id against validatedReminders
      const reminderId = req.houndDeclarationExtendedProperties.validatedVariables.validatedReminderIds.find((validatedReminderId) => validatedReminderId === formatNumber(reminder['reminderId']));
      const reminderAction = formatUnknownString(reminder['reminderAction']);
      const reminderCustomActionName = formatUnknownString(reminder['reminderCustomActionName']);
      const reminderType = formatUnknownString(reminder['reminderType']);
      const reminderIsEnabled = formatNumber(reminder['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(reminder['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(reminder['reminderExecutionDate']);
      const snoozeExecutionInterval = formatNumber(reminder['snoozeExecutionInterval']);
      const countdownExecutionInterval = formatNumber(reminder['countdownExecutionInterval']);
      const weeklyUTCHour = formatNumber(reminder['weeklyUTCHour']);
      const weeklyUTCMinute = formatNumber(reminder['weeklyUTCMinute']);
      const weeklySunday = formatNumber(reminder['weeklySunday']);
      const weeklyMonday = formatNumber(reminder['weeklyMonday']);
      const weeklyTuesday = formatNumber(reminder['weeklyTuesday']);
      const weeklyWednesday = formatNumber(reminder['weeklyWednesday']);
      const weeklyThursday = formatNumber(reminder['weeklyThursday']);
      const weeklyFriday = formatNumber(reminder['weeklyFriday']);
      const weeklySaturday = formatNumber(reminder['weeklySaturday']);
      const weeklySkippedDate = formatDate(reminder['weeklySkippedDate']);

      const monthlyUTCDay = formatNumber(reminder['monthlyUTCDay']);
      const monthlyUTCHour = formatNumber(reminder['monthlyUTCHour']);
      const monthlyUTCMinute = formatNumber(reminder['monthlyUTCMinute']);
      const monthlySkippedDate = formatDate(reminder['monthlySkippedDate']);

      const oneTimeDate = formatDate(reminder['oneTimeDate']);

      if (reminderId === undefined || reminderId === null) {
        throw new HoundError('reminderId missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
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
        dogId: validatedDogId,
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

    await updateRemindersForDogIdReminders(databaseConnection, reminders);

    // update was successful, so we can create all new alarm notifications
    reminders.forEach((reminder) => {
      createAlarmNotificationForFamily(
        validatedFamilyId,
        reminder.reminderId,
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
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedReminderIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedReminderIds === undefined || validatedReminderIds === null) {
      throw new HoundError('validatedReminderIds missing', deleteReminder, ERROR_CODES.VALUE.INVALID);
    }

    await deleteRemindersForFamilyIdDogIdReminderIds(databaseConnection, validatedFamilyId, validatedReminderIds);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};
