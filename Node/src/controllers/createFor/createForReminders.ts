import { DogRemindersRow, dogRemindersColumns } from '../../main/types/DogRemindersRow';

import { Queryable, ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery';
import { LIMIT } from '../../main/server/globalConstants';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

/**
*  Queries the database to create a single reminder. If the query is successful, then returns the reminder with created reminderId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createReminderForDogIdReminder(
  databaseConnection: Queryable,
  reminder: DogRemindersRow,
): Promise<number> {
  // only retrieve enough not deleted reminders that would exceed the limit
  const reminders = await databaseQuery<DogRemindersRow[]>(
    databaseConnection,
    `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE reminderIsDeleted = 0 AND dogId = ?
      LIMIT ?`,
    [reminder.dogId, LIMIT.NUMBER_OF_REMINDERS_PER_DOG],
  );

  // make sure that the user isn't creating too many reminders
  if (reminders.length >= LIMIT.NUMBER_OF_REMINDERS_PER_DOG) {
    throw new HoundError(`Dog reminder limit of ${LIMIT.NUMBER_OF_REMINDERS_PER_DOG} exceeded`, createReminderForDogIdReminder, ERROR_CODES.FAMILY.LIMIT.REMINDER_TOO_LOW);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogReminders(
          dogId,
          reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled,
          reminderExecutionBasis, reminderExecutionDate,
          reminderLastModified, reminderIsDeleted,
          snoozeExecutionInterval,
          countdownExecutionInterval,
          weeklyUTCHour, weeklyUTCMinute,
          weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday,
          weeklySkippedDate,
          monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute,
          monthlySkippedDate,
          oneTimeDate
          )
          VALUES (
            ?,
            ?, ?, ?, ?,
            ?, ?,
            CURRENT_TIMESTAMP(), 0,
            ?,
            ?,
            ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?,
            ?, ?, ?,
            ?,
            ?
            )`,
    [
      reminder.dogId,
      reminder.reminderAction, reminder.reminderCustomActionName, reminder.reminderType, reminder.reminderIsEnabled,
      reminder.reminderExecutionBasis, reminder.reminderExecutionDate,
      // none, default values
      reminder.snoozeExecutionInterval,
      reminder.countdownExecutionInterval,
      reminder.weeklyUTCHour, reminder.weeklyUTCMinute,
      reminder.weeklySunday, reminder.weeklyMonday, reminder.weeklyTuesday, reminder.weeklyWednesday, reminder.weeklyThursday, reminder.weeklyFriday, reminder.weeklySaturday,
      reminder.weeklySkippedDate,
      reminder.monthlyUTCDay, reminder.monthlyUTCHour, reminder.monthlyUTCMinute,
      reminder.monthlySkippedDate,
      reminder.oneTimeDate,
    ],
  );

  return result.insertId;
}

/**
          * Queries the database to create a multiple reminders. If the query is successful, then returns the reminders with their created reminderIds added to them.
          *  If a problem is encountered, creates and throws custom error
          */
async function createRemindersForDogIdReminders(databaseConnection: Queryable, reminders: DogRemindersRow[]): Promise<DogRemindersRow[]> {
  const promises: Promise<number>[] = [];
  reminders.forEach((reminder) => {
    // retrieve the original provided body AND the created id
    promises.push(createReminderForDogIdReminder(
      databaseConnection,
      reminder,
    ));
  });

  const reminderIds = await Promise.all(promises);

  const returnReminders = reminders;
  for (let i = 0; i < promises.length; i += 1) {
    // We got the newly created reminderId back from inserting each reminder, add it back to the original reminder body
    returnReminders[i].reminderId = reminderIds[i];
  }

  return returnReminders;
}

export { createRemindersForDogIdReminders };
