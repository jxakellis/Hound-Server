import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../../main/types/rows/DogRemindersRow.js';
import { getReminderNotificationUsersForReminderUUID, getReminderNotificationUsersForReminderUUIDs } from './getReminderRecipient.js';

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

  const reminder = reminders.safeIndex(0);
  if (reminder === undefined) {
    return undefined;
  }
  const notificationUsers = await getReminderNotificationUsersForReminderUUID(databaseConnection, reminder.reminderUUID);
  reminder.reminderRecipientUserIds = notificationUsers.map((n) => n.userId);

  return reminder;
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
      WHERE dogUUID = ? AND TIMESTAMPDIFF(MICROSECOND, COALESCE(reminderLastModified, reminderCreated), ?) <= 0
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

  const reminderUUIDs = reminders.map((r) => r.reminderUUID);
  if (reminderUUIDs.length > 0) {
    const notificationRows = await getReminderNotificationUsersForReminderUUIDs(databaseConnection, reminderUUIDs);
    reminders.forEach((reminder, index) => {
      reminders[index].reminderRecipientUserIds = notificationRows
        .filter((n) => n.reminderUUID === reminder.reminderUUID)
        .map((n) => n.userId);
    });
  }

  return reminders;
}

export { getReminderForReminderUUID, getAllRemindersForDogUUID };
