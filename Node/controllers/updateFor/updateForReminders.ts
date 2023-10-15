import { DogRemindersRow } from '../../main/types/DogRemindersRow';

import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

/**
 *  Queries the database to create a update reminder. If the query is successful, then returns the provided reminder
 *  If a problem is encountered, creates and throws custom error
 */
async function updateReminderForDogIdReminder(
  databaseConnection: Queryable,
  dogId: number,
  reminder: Partial<DogRemindersRow>,
): Promise<void> {
  const {
    reminderId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate,
    snoozeExecutionInterval, countdownExecutionInterval,
    weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday, weeklySkippedDate,
    monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, monthlySkippedDate,
    oneTimeDate,
  } = reminder;
  if (reminderId === undefined) {
    throw new HoundError('reminderId missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderAction === undefined) {
    throw new HoundError('reminderAction missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderCustomActionName === undefined) {
    throw new HoundError('reminderCustomActionName missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderType === undefined) {
    throw new HoundError('reminderType missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderType !== 'countdown' && reminderType !== 'weekly' && reminderType !== 'monthly' && reminderType !== 'oneTime') {
    throw new HoundError('reminderType invalid', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.INVALID);
  }
  if (reminderIsEnabled === undefined) {
    throw new HoundError('reminderIsEnabled missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // reminderExecutionDate optional
  if (reminderExecutionBasis === undefined) {
    throw new HoundError('reminderExecutionBasis missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // snoozeExecutionInterval optional
  if (countdownExecutionInterval === undefined) {
    throw new HoundError('countdownExecutionInterval missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyUTCHour === undefined) {
    throw new HoundError('weeklyUTCHour missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyUTCMinute === undefined) {
    throw new HoundError('weeklyUTCMinute missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklySunday === undefined) {
    throw new HoundError('weeklySunday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyMonday === undefined) {
    throw new HoundError('weeklyMonday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyTuesday === undefined) {
    throw new HoundError('weeklyTuesday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyWednesday === undefined) {
    throw new HoundError('weeklyWednesday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyThursday === undefined) {
    throw new HoundError('weeklyThursday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyFriday === undefined) {
    throw new HoundError('weeklyFriday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklySaturday === undefined) {
    throw new HoundError('weeklySaturday missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // weeklySkippedDate optional
  if (monthlyUTCDay === undefined) {
    throw new HoundError('monthlyUTCDay missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (monthlyUTCHour === undefined) {
    throw new HoundError('monthlyUTCHour missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (monthlyUTCMinute === undefined) {
    throw new HoundError('monthlyUTCMinute missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // monthlySkippedDate optional
  if (oneTimeDate === undefined) {
    throw new HoundError('oneTimeDate missing', 'updateReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderAction = ?, reminderCustomActionName = ?, reminderType = ?, reminderIsEnabled = ?, reminderExecutionBasis = ?, reminderExecutionDate = ?,
    reminderLastModified = CURRENT_TIMESTAMP(),
    snoozeExecutionInterval = ?, countdownExecutionInterval = ?,
    weeklyUTCHour = ?, weeklyUTCMinute = ?, weeklySunday = ?, weeklyMonday = ?, weeklyTuesday = ?, weeklyWednesday = ?, weeklyThursday = ?, weeklyFriday = ?, weeklySaturday = ?, weeklySkippedDate = ?,
    monthlyUTCDay = ?, monthlyUTCHour = ?, monthlyUTCMinute = ?, monthlySkippedDate = ?,
    oneTimeDate = ?
    WHERE reminderId = ?`,
    [
      reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate,
      snoozeExecutionInterval, countdownExecutionInterval,
      weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday, weeklySkippedDate,
      monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, monthlySkippedDate,
      oneTimeDate,
      reminderId,
    ],
  );
}

/**
 *  Queries the database to update multiple reminders. If the query is successful, then return the provided reminders
 *  If a problem is encountered, creates and throws custom error
 */
async function updateRemindersForDogIdReminders(databaseConnection: Queryable, dogId: number, reminders: Partial<DogRemindersRow>[]): Promise<void> {
  const promises = [];
  for (let i = 0; i < reminders.length; i += 1) {
    const { reminderId } = reminders[i];

    if (reminderId === undefined) {
      throw new HoundError('reminderId missing', 'updateRemindersForDogIdReminders', ERROR_CODES.VALUE.MISSING);
    }

    promises.push(updateReminderForDogIdReminder(databaseConnection, dogId, reminders[i]));
  }

  await Promise.all(promises);
}

export { updateReminderForDogIdReminder, updateRemindersForDogIdReminders };
