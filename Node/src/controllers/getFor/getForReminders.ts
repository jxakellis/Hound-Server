import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../main/types/DogRemindersRow.js';

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 */
async function getReminderForReminderUUID(
  databaseConnection: Queryable,
  reminderUUID: string,
  includeDeletedReminders: boolean,
): Promise<DogRemindersRow | undefined> {
  let reminders = await databaseQuery<DogRemindersRow[]>(
    databaseConnection,
    `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE reminderUUID = ?
      LIMIT 1`,
    [reminderUUID],
  );

  if (includeDeletedReminders === false) {
    reminders = reminders.filter((possiblyDeletedReminders) => possiblyDeletedReminders.reminderIsDeleted === 0);
  }

  return reminders.safeIndex(0);
}

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllRemindersForDogUUID(databaseConnection: Queryable, dogUUID: string, includeDeletedReminders: boolean, previousDogManagerSynchronization?: Date): Promise<DogRemindersRow[]> {
  let reminders = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE dogUUID = ? AND TIMESTAMPDIFF(MICROSECOND, reminderLastModified, ?) <= 0
      LIMIT 18446744073709551615`,
      [dogUUID, previousDogManagerSynchronization],
    )
    : await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE dogUUID = ?
      LIMIT 18446744073709551615`,
      [dogUUID],
    );

  if (includeDeletedReminders === false) {
    reminders = reminders.filter((possiblyDeletedReminders) => possiblyDeletedReminders.reminderIsDeleted === 0);
  }

  return reminders;
}

export { getReminderForReminderUUID, getAllRemindersForDogUUID };
