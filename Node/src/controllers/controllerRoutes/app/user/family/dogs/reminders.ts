import express from 'express';
import { createAlarmNotificationForFamily } from '../../../../../../main/tools/notifications/alarm/createAlarmNotification.js';

import { getReminderForReminderUUID, getAllRemindersForDogUUID } from '../../../../../get/reminders/getReminders.js';

import { createRemindersForReminders } from '../../../../../create/reminders/createReminders.js';

import { updateRemindersForReminders } from '../../../../../update/reminders/updateReminders.js';

import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import {
  formatDate, formatNumber, formatUnknownString, formatArray,
} from '../../../../../../main/format/formatObject.js';
import { type NotYetCreatedDogRemindersRow, type NotYetUpdatedDogRemindersRow } from '../../../../../../main/types/rows/DogRemindersRow.js';
import { getFamilyMembersForFamilyId } from '../../../../../../controllers/get/getFamily.js';
import { deleteRemindersForFamilyIdReminderUUIDs } from '../../../../../../controllers/delete/reminders/deleteReminders.js';

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
    const { validatedFamilyId, validatedDogs, validatedUserId } = req.houndProperties.validatedVars;
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
    const familyMembers = await getFamilyMembersForFamilyId(databaseConnection, validatedFamilyId);
    const defaultUserIds = familyMembers.map((fm) => fm.userId);

    unvalidatedRemindersDict.forEach((unvalidatedReminderDict) => {
      const reminderUUID = formatUnknownString(unvalidatedReminderDict['reminderUUID'], 36);
      const reminderActionTypeId = formatNumber(unvalidatedReminderDict['reminderActionTypeId']);
      const reminderCustomActionName = formatUnknownString(unvalidatedReminderDict['reminderCustomActionName']);
      const reminderType = formatUnknownString(unvalidatedReminderDict['reminderType']);
      const reminderIsTriggerResult = formatNumber(unvalidatedReminderDict['reminderIsTriggerResult']);
      const reminderIsEnabled = formatNumber(unvalidatedReminderDict['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(unvalidatedReminderDict['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(unvalidatedReminderDict['reminderExecutionDate']);

      const snoozeExecutionInterval = formatNumber(unvalidatedReminderDict['snoozeExecutionInterval']);

      const countdownExecutionInterval = formatNumber(unvalidatedReminderDict['countdownExecutionInterval']);

      const weeklyZonedHour = formatNumber(unvalidatedReminderDict['weeklyZonedHour']);
      const weeklyZonedMinute = formatNumber(unvalidatedReminderDict['weeklyZonedMinute']);
      const weeklyZonedSunday = formatNumber(unvalidatedReminderDict['weeklyZonedSunday']);
      const weeklyZonedMonday = formatNumber(unvalidatedReminderDict['weeklyZonedMonday']);
      const weeklyZonedTuesday = formatNumber(unvalidatedReminderDict['weeklyZonedTuesday']);
      const weeklyZonedWednesday = formatNumber(unvalidatedReminderDict['weeklyZonedWednesday']);
      const weeklyZonedThursday = formatNumber(unvalidatedReminderDict['weeklyZonedThursday']);
      const weeklyZonedFriday = formatNumber(unvalidatedReminderDict['weeklyZonedFriday']);
      const weeklyZonedSaturday = formatNumber(unvalidatedReminderDict['weeklyZonedSaturday']);
      const weeklySkippedDate = formatDate(unvalidatedReminderDict['weeklySkippedDate']);

      const monthlyZonedDay = formatNumber(unvalidatedReminderDict['monthlyZonedDay']);
      const monthlyZonedHour = formatNumber(unvalidatedReminderDict['monthlyZonedHour']);
      const monthlyZonedMinute = formatNumber(unvalidatedReminderDict['monthlyZonedMinute']);
      const monthlySkippedDate = formatDate(unvalidatedReminderDict['monthlySkippedDate']);

      const oneTimeDate = formatDate(unvalidatedReminderDict['oneTimeDate']);

      const notifUsersRaw = formatArray(unvalidatedReminderDict['reminderRecipientUserIds']);
      const reminderRecipientUserIds = notifUsersRaw !== undefined
        ? notifUsersRaw.map((id) => formatUnknownString(id) ?? '').filter((id) => id !== '')
        : defaultUserIds;

      const reminderTimeZone = formatUnknownString(unvalidatedReminderDict['reminderTimeZone'], 100);

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
      if (weeklyZonedHour === undefined || weeklyZonedHour === null) {
        throw new HoundError('weeklyZonedHour missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedMinute === undefined || weeklyZonedMinute === null) {
        throw new HoundError('weeklyZonedMinute missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedSunday === undefined || weeklyZonedSunday === null) {
        throw new HoundError('weeklyZonedSunday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedMonday === undefined || weeklyZonedMonday === null) {
        throw new HoundError('weeklyZonedMonday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedTuesday === undefined || weeklyZonedTuesday === null) {
        throw new HoundError('weeklyZonedTuesday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedWednesday === undefined || weeklyZonedWednesday === null) {
        throw new HoundError('weeklyZonedWednesday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedThursday === undefined || weeklyZonedThursday === null) {
        throw new HoundError('weeklyZonedThursday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedFriday === undefined || weeklyZonedFriday === null) {
        throw new HoundError('weeklyZonedFriday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedSaturday === undefined || weeklyZonedSaturday === null) {
        throw new HoundError('weeklyZonedSaturday missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // weeklySkippedDate optional
      if (monthlyZonedDay === undefined || monthlyZonedDay === null) {
        throw new HoundError('monthlyZonedDay missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyZonedHour === undefined || monthlyZonedHour === null) {
        throw new HoundError('monthlyZonedHour missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyZonedMinute === undefined || monthlyZonedMinute === null) {
        throw new HoundError('monthlyZonedMinute missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      // monthlySkippedDate optional
      if (oneTimeDate === undefined || oneTimeDate === null) {
        throw new HoundError('oneTimeDate missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderRecipientUserIds === undefined || reminderRecipientUserIds === null) {
        throw new HoundError('reminderRecipientUserIds missing', createReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderTimeZone === undefined || reminderTimeZone === null) {
        throw new HoundError('reminderTimeZone missing', createReminder, ERROR_CODES.VALUE.MISSING);
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
        reminderCreatedBy: validatedUserId,
        snoozeExecutionInterval,
        countdownExecutionInterval,
        weeklyZonedHour,
        weeklyZonedMinute,
        weeklyZonedSunday,
        weeklyZonedMonday,
        weeklyZonedTuesday,
        weeklyZonedWednesday,
        weeklyZonedThursday,
        weeklyZonedFriday,
        weeklyZonedSaturday,
        weeklySkippedDate,
        monthlyZonedDay,
        monthlyZonedHour,
        monthlyZonedMinute,
        monthlySkippedDate,
        oneTimeDate,
        reminderRecipientUserIds,
        reminderTimeZone,
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
    const { validatedFamilyId, validatedReminders, validatedUserId } = req.houndProperties.validatedVars;
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
    const familyMembers = await getFamilyMembersForFamilyId(databaseConnection, validatedFamilyId);
    const defaultUserIds = familyMembers.map((fm) => fm.userId);

    validatedReminders.forEach((validatedReminder) => {
      // validate reminder id against validatedReminders
      const reminderId = validatedReminder.validatedReminderId;
      const reminderUUID = validatedReminder.validatedReminderUUID;
      const dogUUID = validatedReminder.validatedDogUUID;
      const reminderActionTypeId = formatNumber(validatedReminder.unvalidatedReminderDict?.['reminderActionTypeId']);
      const reminderCustomActionName = formatUnknownString(validatedReminder.unvalidatedReminderDict?.['reminderCustomActionName']);
      const reminderType = formatUnknownString(validatedReminder.unvalidatedReminderDict?.['reminderType']);
      const reminderIsTriggerResult = formatNumber(validatedReminder.unvalidatedReminderDict?.['reminderIsTriggerResult']);
      const reminderIsEnabled = formatNumber(validatedReminder.unvalidatedReminderDict?.['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(validatedReminder.unvalidatedReminderDict?.['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(validatedReminder.unvalidatedReminderDict?.['reminderExecutionDate']);

      const snoozeExecutionInterval = formatNumber(validatedReminder.unvalidatedReminderDict?.['snoozeExecutionInterval']);

      const countdownExecutionInterval = formatNumber(validatedReminder.unvalidatedReminderDict?.['countdownExecutionInterval']);

      const weeklyZonedHour = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedHour']);
      const weeklyZonedMinute = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedMinute']);
      const weeklyZonedSunday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedSunday']);
      const weeklyZonedMonday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedMonday']);
      const weeklyZonedTuesday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedTuesday']);
      const weeklyZonedWednesday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedWednesday']);
      const weeklyZonedThursday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedThursday']);
      const weeklyZonedFriday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedFriday']);
      const weeklyZonedSaturday = formatNumber(validatedReminder.unvalidatedReminderDict?.['weeklyZonedSaturday']);
      const weeklySkippedDate = formatDate(validatedReminder.unvalidatedReminderDict?.['weeklySkippedDate']);

      const monthlyZonedDay = formatNumber(validatedReminder.unvalidatedReminderDict?.['monthlyZonedDay']);
      const monthlyZonedHour = formatNumber(validatedReminder.unvalidatedReminderDict?.['monthlyZonedHour']);
      const monthlyZonedMinute = formatNumber(validatedReminder.unvalidatedReminderDict?.['monthlyZonedMinute']);
      const monthlySkippedDate = formatDate(validatedReminder.unvalidatedReminderDict?.['monthlySkippedDate']);

      const oneTimeDate = formatDate(validatedReminder.unvalidatedReminderDict?.['oneTimeDate']);

      const notifUsersRaw = formatArray(validatedReminder.unvalidatedReminderDict?.['reminderRecipientUserIds']);
      const reminderRecipientUserIds = notifUsersRaw !== undefined
        ? notifUsersRaw.map((id) => formatUnknownString(id) ?? '').filter((id) => id !== '')
        : defaultUserIds;
      const reminderTimeZone = formatUnknownString(validatedReminder.unvalidatedReminderDict?.['reminderTimeZone'], 100) ?? 'UTC';

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
      if (weeklyZonedHour === undefined || weeklyZonedHour === null) {
        throw new HoundError('weeklyZonedHour missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedMinute === undefined || weeklyZonedMinute === null) {
        throw new HoundError('weeklyZonedMinute missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedSunday === undefined || weeklyZonedSunday === null) {
        throw new HoundError('weeklyZonedSunday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedMonday === undefined || weeklyZonedMonday === null) {
        throw new HoundError('weeklyZonedMonday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedTuesday === undefined || weeklyZonedTuesday === null) {
        throw new HoundError('weeklyZonedTuesday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedWednesday === undefined || weeklyZonedWednesday === null) {
        throw new HoundError('weeklyZonedWednesday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedThursday === undefined || weeklyZonedThursday === null) {
        throw new HoundError('weeklyZonedThursday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedFriday === undefined || weeklyZonedFriday === null) {
        throw new HoundError('weeklyZonedFriday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (weeklyZonedSaturday === undefined || weeklyZonedSaturday === null) {
        throw new HoundError('weeklyZonedSaturday missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // weeklySkippedDate optional
      if (monthlyZonedDay === undefined || monthlyZonedDay === null) {
        throw new HoundError('monthlyZonedDay missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyZonedHour === undefined || monthlyZonedHour === null) {
        throw new HoundError('monthlyZonedHour missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (monthlyZonedMinute === undefined || monthlyZonedMinute === null) {
        throw new HoundError('monthlyZonedMinute missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      // monthlySkippedDate optional
      if (oneTimeDate === undefined || oneTimeDate === null) {
        throw new HoundError('oneTimeDate missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderRecipientUserIds === undefined || reminderRecipientUserIds === null) {
        throw new HoundError('reminderRecipientUserIds missing', updateReminder, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderTimeZone === undefined || reminderTimeZone === null) {
        throw new HoundError('reminderTimeZone missing', updateReminder, ERROR_CODES.VALUE.MISSING);
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
        reminderLastModifiedBy: validatedUserId,
        snoozeExecutionInterval,
        countdownExecutionInterval,
        weeklyZonedHour,
        weeklyZonedMinute,
        weeklyZonedSunday,
        weeklyZonedMonday,
        weeklyZonedTuesday,
        weeklyZonedWednesday,
        weeklyZonedThursday,
        weeklyZonedFriday,
        weeklyZonedSaturday,
        weeklySkippedDate,
        monthlyZonedDay,
        monthlyZonedHour,
        monthlyZonedMinute,
        monthlySkippedDate,
        oneTimeDate,
        reminderRecipientUserIds,
        reminderTimeZone,
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
    const { validatedFamilyId, validatedReminders, validatedUserId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteReminder, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedReminders === undefined || validatedReminders === null) {
      throw new HoundError('validatedReminders missing', deleteReminder, ERROR_CODES.VALUE.MISSING);
    }

    await deleteRemindersForFamilyIdReminderUUIDs(
      databaseConnection,
      validatedFamilyId,
      validatedReminders.map((validatedReminder) => validatedReminder.validatedReminderUUID),
      validatedUserId,
    );

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getReminders, createReminder, updateReminder, deleteReminder,
};
