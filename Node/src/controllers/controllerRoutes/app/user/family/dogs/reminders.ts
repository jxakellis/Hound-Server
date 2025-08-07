import express from 'express';
import { createAlarmNotificationForFamily } from '../../../../../../main/tools/notifications/alarm/createAlarmNotification.js';

import { getReminderForReminderUUID, getAllRemindersForDogUUID } from '../../../../../get/reminders/getReminders.js';

import { createMultipleReminders } from '../../../../../create/reminders/createReminders.js';

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
    const { authDogs } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getReminders, ERROR_CODES.VALUE.MISSING);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', getReminders, ERROR_CODES.VALUE.MISSING);
    }

    const { authReminders } = req.houndProperties.authenticated;
    const authReminder = authReminders.safeIndex(0);

    if (authReminder !== undefined && authReminder !== null) {
      const possibleDeletedReminder = await getReminderForReminderUUID(databaseConnection, authReminder.authReminder.reminderUUID, true);

      if (possibleDeletedReminder === undefined || possibleDeletedReminder === null) {
        throw new HoundError('getReminderForReminderUUID possibleDeletedReminder missing', getReminders, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possibleDeletedReminder);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedReminders = await getAllRemindersForDogUUID(databaseConnection, authDog.authDog.dogUUID, true, previousDogManagerSynchronization);

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
    const { authFamilyId, authDogs, authUserId } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    const { unauthRemindersDict } = req.houndProperties.unauthenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', createReminder, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (unauthRemindersDict === undefined || unauthRemindersDict === null) {
      throw new HoundError('unauthRemindersDict missing', createReminder, ERROR_CODES.VALUE.MISSING);
    }

    const reminders: NotYetCreatedDogRemindersRow[] = [];
    const familyMembers = await getFamilyMembersForFamilyId(databaseConnection, authFamilyId);
    const defaultUserIds = familyMembers.map((fm) => fm.userId);

    unauthRemindersDict.forEach((unauthNewReminderDict) => {
      const reminderUUID = formatUnknownString(unauthNewReminderDict['reminderUUID'], 36);
      const reminderActionTypeId = formatNumber(unauthNewReminderDict['reminderActionTypeId']);
      const reminderCustomActionName = formatUnknownString(unauthNewReminderDict['reminderCustomActionName']);
      const reminderType = formatUnknownString(unauthNewReminderDict['reminderType']);
      const reminderIsTriggerResult = formatNumber(unauthNewReminderDict['reminderIsTriggerResult']);
      const reminderIsEnabled = formatNumber(unauthNewReminderDict['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(unauthNewReminderDict['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(unauthNewReminderDict['reminderExecutionDate']);

      const snoozeExecutionInterval = formatNumber(unauthNewReminderDict['snoozeExecutionInterval']);

      const countdownExecutionInterval = formatNumber(unauthNewReminderDict['countdownExecutionInterval']);

      const weeklyZonedHour = formatNumber(unauthNewReminderDict['weeklyZonedHour']);
      const weeklyZonedMinute = formatNumber(unauthNewReminderDict['weeklyZonedMinute']);
      const weeklyZonedSunday = formatNumber(unauthNewReminderDict['weeklyZonedSunday']);
      const weeklyZonedMonday = formatNumber(unauthNewReminderDict['weeklyZonedMonday']);
      const weeklyZonedTuesday = formatNumber(unauthNewReminderDict['weeklyZonedTuesday']);
      const weeklyZonedWednesday = formatNumber(unauthNewReminderDict['weeklyZonedWednesday']);
      const weeklyZonedThursday = formatNumber(unauthNewReminderDict['weeklyZonedThursday']);
      const weeklyZonedFriday = formatNumber(unauthNewReminderDict['weeklyZonedFriday']);
      const weeklyZonedSaturday = formatNumber(unauthNewReminderDict['weeklyZonedSaturday']);
      const weeklySkippedDate = formatDate(unauthNewReminderDict['weeklySkippedDate']);

      const monthlyZonedDay = formatNumber(unauthNewReminderDict['monthlyZonedDay']);
      const monthlyZonedHour = formatNumber(unauthNewReminderDict['monthlyZonedHour']);
      const monthlyZonedMinute = formatNumber(unauthNewReminderDict['monthlyZonedMinute']);
      const monthlySkippedDate = formatDate(unauthNewReminderDict['monthlySkippedDate']);

      const oneTimeDate = formatDate(unauthNewReminderDict['oneTimeDate']);

      const notifUsersRaw = formatArray(unauthNewReminderDict['reminderRecipientUserIds']);
      const reminderRecipientUserIds = notifUsersRaw !== undefined
        ? notifUsersRaw.map((id) => formatUnknownString(id) ?? '').filter((id) => id !== '')
        : defaultUserIds;

      const reminderTimeZone = formatUnknownString(unauthNewReminderDict['reminderTimeZone'], 100);

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
        dogUUID: authDog.authDog.dogUUID,
        reminderUUID,
        reminderActionTypeId,
        reminderCustomActionName,
        reminderType,
        reminderIsTriggerResult,
        reminderIsEnabled,
        reminderExecutionBasis,
        reminderExecutionDate,
        reminderCreatedBy: authUserId,
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

    const results = await createMultipleReminders(databaseConnection, reminders);

    // create was successful, so we can create all the alarm notifications
    results.forEach((result) => {
      createAlarmNotificationForFamily(
        authFamilyId,
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
    const { authFamilyId, authReminders, authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authReminders === undefined || authReminders === null) {
      throw new HoundError('authReminders missing', updateReminder, ERROR_CODES.VALUE.MISSING);
    }

    const reminders: NotYetUpdatedDogRemindersRow[] = [];

    authReminders.forEach((authReminder) => {
      // validate reminder id against authReminders
      const { reminderId } = authReminder.authReminder;
      const { reminderUUID } = authReminder.authReminder;
      const { dogUUID } = authReminder.authReminder;
      const reminderActionTypeId = formatNumber(authReminder.unauthNewReminderDict?.['reminderActionTypeId']);
      const reminderCustomActionName = formatUnknownString(authReminder.unauthNewReminderDict?.['reminderCustomActionName']);
      const reminderType = formatUnknownString(authReminder.unauthNewReminderDict?.['reminderType']);
      const reminderIsTriggerResult = formatNumber(authReminder.unauthNewReminderDict?.['reminderIsTriggerResult']);
      const reminderIsEnabled = formatNumber(authReminder.unauthNewReminderDict?.['reminderIsEnabled']);
      const reminderExecutionBasis = formatDate(authReminder.unauthNewReminderDict?.['reminderExecutionBasis']);
      const reminderExecutionDate = formatDate(authReminder.unauthNewReminderDict?.['reminderExecutionDate']);

      const snoozeExecutionInterval = formatNumber(authReminder.unauthNewReminderDict?.['snoozeExecutionInterval']);

      const countdownExecutionInterval = formatNumber(authReminder.unauthNewReminderDict?.['countdownExecutionInterval']);

      const weeklyZonedHour = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedHour']);
      const weeklyZonedMinute = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedMinute']);
      const weeklyZonedSunday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedSunday']);
      const weeklyZonedMonday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedMonday']);
      const weeklyZonedTuesday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedTuesday']);
      const weeklyZonedWednesday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedWednesday']);
      const weeklyZonedThursday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedThursday']);
      const weeklyZonedFriday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedFriday']);
      const weeklyZonedSaturday = formatNumber(authReminder.unauthNewReminderDict?.['weeklyZonedSaturday']);
      const weeklySkippedDate = formatDate(authReminder.unauthNewReminderDict?.['weeklySkippedDate']);

      const monthlyZonedDay = formatNumber(authReminder.unauthNewReminderDict?.['monthlyZonedDay']);
      const monthlyZonedHour = formatNumber(authReminder.unauthNewReminderDict?.['monthlyZonedHour']);
      const monthlyZonedMinute = formatNumber(authReminder.unauthNewReminderDict?.['monthlyZonedMinute']);
      const monthlySkippedDate = formatDate(authReminder.unauthNewReminderDict?.['monthlySkippedDate']);

      const oneTimeDate = formatDate(authReminder.unauthNewReminderDict?.['oneTimeDate']);

      const notifUsersRaw = formatArray(authReminder.unauthNewReminderDict?.['reminderRecipientUserIds']);
      const reminderRecipientUserIds = notifUsersRaw !== undefined
        ? notifUsersRaw.map((id) => formatUnknownString(id) ?? '').filter((id) => id !== '')
        : [];
      const reminderTimeZone = formatUnknownString(authReminder.unauthNewReminderDict?.['reminderTimeZone'], 100) ?? 'UTC';

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
        reminderLastModifiedBy: authUserId,
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
        authFamilyId,
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
    const { authFamilyId, authReminders, authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteReminder, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteReminder, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteReminder, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authReminders === undefined || authReminders === null) {
      throw new HoundError('authReminders missing', deleteReminder, ERROR_CODES.VALUE.MISSING);
    }

    await deleteRemindersForFamilyIdReminderUUIDs(
      databaseConnection,
      authFamilyId,
      authReminders.map((authReminder) => authReminder.authReminder.reminderUUID),
      authUserId,
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
