import { type DogRemindersRow, type NotYetCreatedDogRemindersRow } from '../../main/types/DogRemindersRow.js';

import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { LIMIT } from '../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { getAllRemindersForDogId } from '../getFor/getForReminders.js';

/**
*  Queries the database to create a single reminder. If the query is successful, then returns the reminder with created reminderId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createReminderForDogIdReminder(
  databaseConnection: Queryable,
  reminder: NotYetCreatedDogRemindersRow,
): Promise<number> {
  const notDeletedReminders = await getAllRemindersForDogId(databaseConnection, reminder.dogId, false, undefined);

  // make sure that the user isn't creating too many reminders
  if (notDeletedReminders.length >= LIMIT.NUMBER_OF_REMINDERS_PER_DOG) {
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
async function createRemindersForDogIdReminders(
  databaseConnection: Queryable,
  reminders: NotYetCreatedDogRemindersRow[],
): Promise<DogRemindersRow[]> {
  const promises: Promise<number>[] = [];
  reminders.forEach((reminder) => {
    // retrieve the original provided body AND the created id
    promises.push(createReminderForDogIdReminder(
      databaseConnection,
      reminder,
    ));
  });

  const reminderIds = await Promise.all(promises);

  const someReminder = reminders.safeIndex(0);

  if (someReminder === undefined || someReminder === null) {
    // Only way this happens is if reminders is an empty array
    return [];
  }

  const notDeletedReminders = await getAllRemindersForDogId(databaseConnection, someReminder.dogId, false);
  // Once we have created all of the reminders, we need to return them to the user. Its hard to link the omit and non-omit types, so just use the dogId to query the reminders, and only include the ones we just created
  const notDeletedReturnReminders = notDeletedReminders.filter((reminderFromDatabase) => reminderIds.includes(reminderFromDatabase.reminderId));

  return notDeletedReturnReminders;
}

export { createRemindersForDogIdReminders };
