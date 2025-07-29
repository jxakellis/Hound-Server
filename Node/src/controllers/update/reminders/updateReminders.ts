import { type NotYetUpdatedDogRemindersRow } from '../../../main/types/rows/DogRemindersRow.js';

import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { formatKnownString } from '../../../main/format/formatObject.js';
import { getReminderActionTypeForId } from '../../get/types/getReminderActionType.js';
import { getReminderForReminderUUID } from '../../get/reminders/getReminders.js';
import { ERROR_CODES, HoundError } from '../../../main/server/globalErrors.js';
import { updateReminderRecipientForReminder } from './updateReminderRecipient.js';

/**
 *  Queries the database to create a update reminder. If the query is successful, then returns the provided reminder
 *  If a problem is encountered, creates and throws custom error
 */
async function updateReminderForReminder(
  databaseConnection: Queryable,
  reminder: NotYetUpdatedDogRemindersRow,
): Promise<void> {
  const existingReminder = await getReminderForReminderUUID(databaseConnection, reminder.reminderUUID, false);

  if (existingReminder === undefined) {
    throw new HoundError('No reminder found or invalid permissions', updateReminderForReminder, ERROR_CODES.VALUE.MISSING);
  }
  if (existingReminder.reminderIsTriggerResult === 1 || reminder.reminderIsTriggerResult === 1) {
    throw new HoundError('Unable to modify a reminder that was created by a trigger', updateReminderForReminder, ERROR_CODES.VALUE.MISSING);
  }

  // TODO FUTURE DEPRECIATE this reminderAction is compatibility for <= 4.0.0
  const reminderAction = await getReminderActionTypeForId(databaseConnection, reminder.reminderActionTypeId);

  const promises: Promise<unknown>[] = [];

  promises.push(databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET DEPRECIATED_reminderAction = ?,
    reminderActionTypeId = ?, reminderCustomActionName = ?, reminderType = ?, reminderIsTriggerResult = ?, reminderIsEnabled = ?,
    reminderExecutionBasis = ?, reminderExecutionDate = ?,
    reminderLastModified = CURRENT_TIMESTAMP(),
    snoozeExecutionInterval = ?, countdownExecutionInterval = ?,
    weeklyZonedHour = ?, weeklyZonedMinute = ?,
    weeklyZonedSunday = ?, weeklyZonedMonday = ?, weeklyZonedTuesday = ?, weeklyZonedWednesday = ?, weeklyZonedThursday = ?, weeklyZonedFriday = ?, weeklyZonedSaturday = ?, weeklySkippedDate = ?,
    monthlyZonedDay = ?, monthlyZonedHour = ?, monthlyZonedMinute = ?, monthlySkippedDate = ?,
    oneTimeDate = ?,
    reminderTimeZone = ?
    WHERE reminderUUID = ?`,
    [
      reminderAction?.internalValue,
      reminder.reminderActionTypeId, formatKnownString(reminder.reminderCustomActionName, 32), reminder.reminderType, reminder.reminderIsTriggerResult, reminder.reminderIsEnabled,
      reminder.reminderExecutionBasis, reminder.reminderExecutionDate,
      reminder.snoozeExecutionInterval, reminder.countdownExecutionInterval,
      reminder.weeklyZonedHour, reminder.weeklyZonedMinute,
      reminder.weeklyZonedSunday, reminder.weeklyZonedMonday, reminder.weeklyZonedTuesday, reminder.weeklyZonedWednesday,
      reminder.weeklyZonedThursday, reminder.weeklyZonedFriday, reminder.weeklyZonedSaturday,
      reminder.weeklySkippedDate,
      reminder.monthlyZonedDay, reminder.monthlyZonedHour, reminder.monthlyZonedMinute, reminder.monthlySkippedDate,
      reminder.oneTimeDate,
      reminder.reminderTimeZone,
      reminder.reminderUUID,
    ],
  ));

  promises.push(updateReminderRecipientForReminder(databaseConnection, reminder));
  await Promise.all(promises);
}

/**
 *  Queries the database to update multiple reminders. If the query is successful, then return the provided reminders
 *  If a problem is encountered, creates and throws custom error
 */
async function updateRemindersForReminders(databaseConnection: Queryable, reminders: NotYetUpdatedDogRemindersRow[]): Promise<void> {
  const promises: Promise<void>[] = [];
  reminders.forEach((reminder) => promises.push(updateReminderForReminder(
    databaseConnection,
    reminder,
  )));

  await Promise.all(promises);
}

export { updateRemindersForReminders };
