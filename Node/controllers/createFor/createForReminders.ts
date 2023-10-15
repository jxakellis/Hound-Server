import { DogRemindersRow, prefixDogRemindersColumns, noPrefixDogRemindersColumnsWithNoReminderId } from '../../main/types/DogRemindersRow';

import { Queryable, ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery';
import { LIMIT } from '../../main/server/globalConstants';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

/**
 *  Queries the database to create a single reminder. If the query is successful, then returns the reminder with created reminderId added to it.
 *  If a problem is encountered, creates and throws custom error
 */
async function createReminderForDogIdReminder(databaseConnection: Queryable, dogId: number, reminder: Partial<DogRemindersRow>): Promise<number> {
  // only retrieve enough not deleted reminders that would exceed the limit
  const reminders = await databaseQuery<DogRemindersRow[]>(
    databaseConnection,
    `SELECT ${prefixDogRemindersColumns}
    FROM dogReminders dr
    WHERE reminderIsDeleted = 0 AND dogId = ?
    LIMIT ?`,
    [dogId, LIMIT.NUMBER_OF_REMINDERS_PER_DOG],
  );

  // make sure that the user isn't creating too many reminders
  if (reminders.length >= LIMIT.NUMBER_OF_REMINDERS_PER_DOG) {
    throw new HoundError(`Dog reminder limit of ${LIMIT.NUMBER_OF_REMINDERS_PER_DOG} exceeded`, 'createReminderForDogIdReminder', ERROR_CODES.FAMILY.LIMIT.REMINDER_TOO_LOW);
  }

  const {
    reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate,
    countdownExecutionInterval,
    weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday,
    monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute,
    oneTimeDate,
  } = reminder;

  if (reminderAction === undefined) {
    throw new HoundError('reminderAction missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderCustomActionName === undefined) {
    throw new HoundError('reminderCustomActionName missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderType === undefined) {
    throw new HoundError('reminderType missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (reminderIsEnabled === undefined) {
    throw new HoundError('reminderIsEnabled missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // reminderExecutionDate optional
  if (reminderExecutionBasis === undefined) {
    throw new HoundError('reminderExecutionBasis missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // snoozeExecutionInterval optional
  if (countdownExecutionInterval === undefined) {
    throw new HoundError('countdownExecutionInterval missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyUTCHour === undefined) {
    throw new HoundError('weeklyUTCHour missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyUTCMinute === undefined) {
    throw new HoundError('weeklyUTCMinute missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklySunday === undefined) {
    throw new HoundError('weeklySunday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyMonday === undefined) {
    throw new HoundError('weeklyMonday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyTuesday === undefined) {
    throw new HoundError('weeklyTuesday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyWednesday === undefined) {
    throw new HoundError('weeklyWednesday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyThursday === undefined) {
    throw new HoundError('weeklyThursday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklyFriday === undefined) {
    throw new HoundError('weeklyFriday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (weeklySaturday === undefined) {
    throw new HoundError('weeklySaturday missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // weeklySkippedDate optional
  if (monthlyUTCDay === undefined) {
    throw new HoundError('monthlyUTCDay missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (monthlyUTCHour === undefined) {
    throw new HoundError('monthlyUTCHour missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  if (monthlyUTCMinute === undefined) {
    throw new HoundError('monthlyUTCMinute missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }
  // monthlySkippedDate optional
  if (oneTimeDate === undefined) {
    throw new HoundError('oneTimeDate missing', 'createReminderForDogIdReminder', ERROR_CODES.VALUE.MISSING);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogReminders(
      ${foo}
      )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP(), 0,
      ?,
      ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?)`,
    [
      dogId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate,
      undefined,
      countdownExecutionInterval,
      weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday, undefined,
      monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, undefined,
      oneTimeDate,
    ],
  );

  return result.insertId;
}

/**
   * Queries the database to create a multiple reminders. If the query is successful, then returns the reminders with their created reminderIds added to them.
 *  If a problem is encountered, creates and throws custom error
   */
async function createRemindersForDogIdReminders(databaseConnection: Queryable, dogId: number, forReminders: Partial<DogRemindersRow>[]): Promise<Partial<DogRemindersRow>[]> {
  let promises = [];
  for (let i = 0; i < forReminders.length; i += 1) {
    // retrieve the original provided body AND the created id
    promises.push(createReminderForDogIdReminder(databaseConnection, dogId, forReminders[i]));
  }
  promises = await Promise.all(promises);

  const reminders = forReminders;
  for (let i = 0; i < promises.length; i += 1) {
    // We got the newly created reminderId back from inserting each reminder, add it back to the original reminder body
    reminders[i].reminderId = promises[i];
  }

  return reminders;
}

export { createReminderForDogIdReminder, createRemindersForDogIdReminders };
