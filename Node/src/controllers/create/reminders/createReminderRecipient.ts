import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type NotYetCreatedDogReminderRecipientRow } from '../../../main/types/rows/DogReminderRecipientRow.js';

async function createReminderRecipient(
  databaseConnection: Queryable,
  notification: NotYetCreatedDogReminderRecipientRow,
): Promise<void> {
  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogReminderRecipient(reminderUUID, userId) VALUES (?, ?)',
    [notification.reminderUUID, notification.userId],
  );
}

async function createReminderRecipients(
  databaseConnection: Queryable,
  notifications: NotYetCreatedDogReminderRecipientRow[],
): Promise<void> {
  const promises = notifications.map((n) => createReminderRecipient(databaseConnection, n));
  await Promise.all(promises);
}

export { createReminderRecipient, createReminderRecipients };
