import { type NotYetUpdatedDogRemindersRow } from '../../main/types/rows/DogRemindersRow.js';

import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { formatKnownString } from '../../main/format/formatObject.js';

/**
 *  Queries the database to create a update reminder. If the query is successful, then returns the provided reminder
 *  If a problem is encountered, creates and throws custom error
 */
async function updateReminderForReminder(
  databaseConnection: Queryable,
  reminder: NotYetUpdatedDogRemindersRow,
): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderActionTypeId = ?, reminderCustomActionName = ?, reminderType = ?, reminderIsEnabled = ?,
    reminderExecutionBasis = ?, reminderExecutionDate = ?,
    reminderLastModified = CURRENT_TIMESTAMP(),
    snoozeExecutionInterval = ?, countdownExecutionInterval = ?,
    weeklyUTCHour = ?, weeklyUTCMinute = ?,
    weeklySunday = ?, weeklyMonday = ?, weeklyTuesday = ?, weeklyWednesday = ?, weeklyThursday = ?, weeklyFriday = ?, weeklySaturday = ?, weeklySkippedDate = ?,
    monthlyUTCDay = ?, monthlyUTCHour = ?, monthlyUTCMinute = ?, monthlySkippedDate = ?,
    oneTimeDate = ?
    WHERE reminderUUID = ?`,
    [
      reminder.reminderActionTypeId, formatKnownString(reminder.reminderCustomActionName, 32), reminder.reminderType, reminder.reminderIsEnabled,
      reminder.reminderExecutionBasis, reminder.reminderExecutionDate,
      reminder.snoozeExecutionInterval, reminder.countdownExecutionInterval,
      reminder.weeklyUTCHour, reminder.weeklyUTCMinute,
      reminder.weeklySunday, reminder.weeklyMonday, reminder.weeklyTuesday, reminder.weeklyWednesday, reminder.weeklyThursday, reminder.weeklyFriday, reminder.weeklySaturday,
      reminder.weeklySkippedDate,
      reminder.monthlyUTCDay, reminder.monthlyUTCHour, reminder.monthlyUTCMinute, reminder.monthlySkippedDate,
      reminder.oneTimeDate,
      reminder.reminderUUID,
    ],
  );
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
