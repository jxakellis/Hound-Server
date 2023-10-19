import express from 'express';
import { createAlarmNotificationForFamily } from '../../main/tools/notifications/alarm/createAlarmNotification';

import { getReminderForReminderId, getAllRemindersForDogId } from '../getFor/getForReminders';

import { createRemindersForDogIdReminders } from '../createFor/createForReminders';

import { updateRemindersForDogIdReminders } from '../updateFor/updateForReminders';

import { deleteRemindersForFamilyIdDogIdReminderIds } from '../deleteFor/deleteForReminders';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import {
  formatArray, formatDate, formatNumber, formatUnknownString,
} from '../../main/format/formatObject';
import { Dictionary } from '../../main/types/Dictionary';
import { DogRemindersRow } from '../../main/types/DogRemindersRow';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- dogId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminderId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) reminders is an array with reminderId that are formatted correctly and request has sufficient permissions to use
*/

async function getReminders(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedDogId, validatedReminderIds } = req.extendedProperties.validatedVariables;
    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getReminders, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', getReminders, ERROR_CODES.VALUE.INVALID);
    }

    const validatedReminderId = validatedReminderIds.safeIndex(0);
    if (validatedReminderId !== undefined) {
      const result = await getReminderForReminderId(databaseConnection, validatedReminderId, previousDogManagerSynchronization);

      if (result === undefined) {
        throw new HoundError('result missing', getReminders, ERROR_CODES.VALUE.INVALID);
      }

      return res.extendedProperties.sendSuccessResponse(result);
    }

    const result = await getAllRemindersForDogId(databaseConnection, validatedDogId, previousDogManagerSynchronization);
    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId, validatedDogId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (Dictionary[] | undefined);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (remindersDictionary === undefined) {
      throw new HoundError('remindersDictionary missing', createReminder, ERROR_CODES.VALUE.INVALID);
    }

    const reminders: DogRemindersRow[] = [];
    remindersDictionary.forEach((reminder) => {
      // validate reminder id against validatedReminders
      const reminderId = req.extendedProperties.validatedVariables.validatedReminderIds.find((validatedReminderId) => validatedReminderId === formatNumber(reminder['reminderId']));
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

      if (reminderId === undefined) {
        throw new HoundError('reminderId missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderAction === undefined) {
        throw new HoundError('reminderAction missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined) {
        throw new HoundError('reminderCustomActionName missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderType === undefined) {
        throw new HoundError('reminderType missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderIsEnabled === undefined) {
        throw new HoundError('reminderIsEnabled missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // reminderExecutionDate optional
      if (reminderExecutionBasis === undefined) {
        throw new HoundError('reminderExecutionBasis missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // snoozeExecutionInterval optional
      if (countdownExecutionInterval === undefined) {
        throw new HoundError('countdownExecutionInterval missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCHour === undefined) {
        throw new HoundError('weeklyUTCHour missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCMinute === undefined) {
        throw new HoundError('weeklyUTCMinute missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySunday === undefined) {
        throw new HoundError('weeklySunday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyMonday === undefined) {
        throw new HoundError('weeklyMonday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyTuesday === undefined) {
        throw new HoundError('weeklyTuesday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyWednesday === undefined) {
        throw new HoundError('weeklyWednesday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyThursday === undefined) {
        throw new HoundError('weeklyThursday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyFriday === undefined) {
        throw new HoundError('weeklyFriday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySaturday === undefined) {
        throw new HoundError('weeklySaturday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // weeklySkippedDate optional
      if (monthlyUTCDay === undefined) {
        throw new HoundError('monthlyUTCDay missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCHour === undefined) {
        throw new HoundError('monthlyUTCHour missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCMinute === undefined) {
        throw new HoundError('monthlyUTCMinute missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // monthlySkippedDate optional
      if (oneTimeDate === undefined) {
        throw new HoundError('oneTimeDate missing', createReminder, ERROR_CODES.VALUE.MISSING);
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
        // this value is unused, we just need a placeholder for a valid DogRemindersRow
        reminderLastModified: new Date(),
        // this value is unused, we just need a placeholder for a valid DogRemindersRow
        reminderIsDeleted: 0,
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

    return res.extendedProperties.sendSuccessResponse(results);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function updateReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId, validatedDogId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (Dictionary[] | undefined);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (remindersDictionary === undefined) {
      throw new HoundError('remindersDictionary missing', updateReminder, ERROR_CODES.VALUE.INVALID);
    }

    const reminders: DogRemindersRow[] = [];
    remindersDictionary.forEach((reminder) => {
      // validate reminder id against validatedReminders
      const reminderId = req.extendedProperties.validatedVariables.validatedReminderIds.find((validatedReminderId) => validatedReminderId === formatNumber(reminder['reminderId']));
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

      if (reminderId === undefined) {
        throw new HoundError('reminderId missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderAction === undefined) {
        throw new HoundError('reminderAction missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined) {
        throw new HoundError('reminderCustomActionName missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderType === undefined) {
        throw new HoundError('reminderType missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderIsEnabled === undefined) {
        throw new HoundError('reminderIsEnabled missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // reminderExecutionDate optional
      if (reminderExecutionBasis === undefined) {
        throw new HoundError('reminderExecutionBasis missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // snoozeExecutionInterval optional
      if (countdownExecutionInterval === undefined) {
        throw new HoundError('countdownExecutionInterval missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCHour === undefined) {
        throw new HoundError('weeklyUTCHour missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyUTCMinute === undefined) {
        throw new HoundError('weeklyUTCMinute missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySunday === undefined) {
        throw new HoundError('weeklySunday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyMonday === undefined) {
        throw new HoundError('weeklyMonday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyTuesday === undefined) {
        throw new HoundError('weeklyTuesday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyWednesday === undefined) {
        throw new HoundError('weeklyWednesday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyThursday === undefined) {
        throw new HoundError('weeklyThursday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyFriday === undefined) {
        throw new HoundError('weeklyFriday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklySaturday === undefined) {
        throw new HoundError('weeklySaturday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // weeklySkippedDate optional
      if (monthlyUTCDay === undefined) {
        throw new HoundError('monthlyUTCDay missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCHour === undefined) {
        throw new HoundError('monthlyUTCHour missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyUTCMinute === undefined) {
        throw new HoundError('monthlyUTCMinute missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // monthlySkippedDate optional
      if (oneTimeDate === undefined) {
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
        // this value is unused, we just need a placeholder for a valid DogRemindersRow
        reminderLastModified: new Date(),
        // this value is unused, we just need a placeholder for a valid DogRemindersRow
        reminderIsDeleted: 0,
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

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function deleteReminder(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId, validatedReminderIds } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', deleteReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', deleteReminder, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedReminderIds === undefined) {
      throw new HoundError('validatedReminderIds missing', deleteReminder, ERROR_CODES.VALUE.INVALID);
    }

    await deleteRemindersForFamilyIdDogIdReminderIds(databaseConnection, validatedFamilyId, validatedReminderIds);

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};
