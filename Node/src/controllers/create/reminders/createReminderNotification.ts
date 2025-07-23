import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type NotYetCreatedDogReminderNotificationRow } from '../../../main/types/rows/DogReminderNotificationRow.js';

async function createReminderNotification(
  databaseConnection: Queryable,
  notification: NotYetCreatedDogReminderNotificationRow,
): Promise<void> {
  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogReminderNotification(reminderUUID, userId) VALUES (?, ?)',
    [notification.reminderUUID, notification.userId],
  );
}

async function createReminderNotifications(
  databaseConnection: Queryable,
  notifications: NotYetCreatedDogReminderNotificationRow[],
): Promise<void> {
  const promises = notifications.map((n) => createReminderNotification(databaseConnection, n));
  await Promise.all(promises);
}

export { createReminderNotification, createReminderNotifications };
