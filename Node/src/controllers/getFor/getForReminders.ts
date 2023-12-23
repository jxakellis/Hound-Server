import { formatReminderActionToReadableValue } from '../../main/format/formatReminderAction.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../main/types/DogRemindersRow.js';

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 */
async function getReminderForReminderId(databaseConnection: Queryable, reminderId: number, includeDeletedReminders: boolean): Promise<DogRemindersRow | undefined> {
  let reminders = await databaseQuery<DogRemindersRow[]>(
    databaseConnection,
    `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE reminderId = ?
      LIMIT 1`,
    [reminderId],
  );

  if (includeDeletedReminders === false) {
    reminders = reminders.filter((possiblyDeletedReminders) => possiblyDeletedReminders.reminderIsDeleted === 0);
  }

  reminders = reminders.map((reminder) => ({
    ...reminder,
    // <= 3.1.0 other system of only rawValue used. Doing this makes it backwards compatible
    reminderAction: formatReminderActionToReadableValue(false, reminder.reminderAction, undefined) ?? reminder.reminderAction,
  }));

  return reminders.safeIndex(0);
}

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllRemindersForDogId(databaseConnection: Queryable, dogId: number, includeDeletedReminders: boolean, previousDogManagerSynchronization?: Date): Promise<DogRemindersRow[]> {
  let reminders = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE dogId = ? AND TIMESTAMPDIFF(MICROSECOND, reminderLastModified, ?) <= 0
      LIMIT 18446744073709551615`,
      [dogId, previousDogManagerSynchronization],
    )
    : await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    );

  if (includeDeletedReminders === false) {
    reminders = reminders.filter((possiblyDeletedReminders) => possiblyDeletedReminders.reminderIsDeleted === 0);
  }

  reminders = reminders.map((reminder) => ({
    ...reminder,
    // <= 3.1.0 other system of only rawValue used. Doing this makes it backwards compatible
    reminderAction: formatReminderActionToReadableValue(false, reminder.reminderAction, undefined) ?? reminder.reminderAction,
  }));

  return reminders;
}

export { getReminderForReminderId, getAllRemindersForDogId };
