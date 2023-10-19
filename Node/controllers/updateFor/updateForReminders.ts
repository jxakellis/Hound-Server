import { DogRemindersRow } from '../../main/types/DogRemindersRow';

import { Queryable, databaseQuery } from '../../main/database/databaseQuery';

/**
 *  Queries the database to create a update reminder. If the query is successful, then returns the provided reminder
 *  If a problem is encountered, creates and throws custom error
 */
async function updateReminderForDogIdReminder(
  databaseConnection: Queryable,
  reminder: DogRemindersRow,
): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderAction = ?, reminderCustomActionName = ?, reminderType = ?, reminderIsEnabled = ?, reminderExecutionBasis = ?, reminderExecutionDate = ?,
    reminderLastModified = CURRENT_TIMESTAMP(),
    snoozeExecutionInterval = ?, countdownExecutionInterval = ?,
    weeklyUTCHour = ?, weeklyUTCMinute = ?,
    weeklySunday = ?, weeklyMonday = ?, weeklyTuesday = ?, weeklyWednesday = ?, weeklyThursday = ?, weeklyFriday = ?, weeklySaturday = ?, weeklySkippedDate = ?,
    monthlyUTCDay = ?, monthlyUTCHour = ?, monthlyUTCMinute = ?, monthlySkippedDate = ?,
    oneTimeDate = ?
    WHERE reminderId = ?`,
    [
      reminder.reminderAction, reminder.reminderCustomActionName, reminder.reminderType, reminder.reminderIsEnabled, reminder.reminderExecutionBasis, reminder.reminderExecutionDate,
      reminder.snoozeExecutionInterval, reminder.countdownExecutionInterval,
      reminder.weeklyUTCHour, reminder.weeklyUTCMinute,
      reminder.weeklySunday, reminder.weeklyMonday, reminder.weeklyTuesday, reminder.weeklyWednesday, reminder.weeklyThursday, reminder.weeklyFriday, reminder.weeklySaturday,
      reminder.weeklySkippedDate,
      reminder.monthlyUTCDay, reminder.monthlyUTCHour, reminder.monthlyUTCMinute, reminder.monthlySkippedDate,
      reminder.oneTimeDate,
      reminder.reminderId,
    ],
  );
}

/**
 *  Queries the database to update multiple reminders. If the query is successful, then return the provided reminders
 *  If a problem is encountered, creates and throws custom error
 */
async function updateRemindersForDogIdReminders(databaseConnection: Queryable, reminders: DogRemindersRow[]): Promise<void> {
  const promises: Promise<void>[] = [];
  reminders.forEach((reminder) => promises.push(updateReminderForDogIdReminder(
    databaseConnection,
    reminder,
  )));

  await Promise.all(promises);
}

export { updateRemindersForDogIdReminders };
