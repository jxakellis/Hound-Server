import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type NotYetCreatedDogReminderRecipientRow } from '../../../main/types/rows/DogReminderRecipientRow.js';

async function createSingleReminderRecipient(
  databaseConnection: Queryable,
  notification: NotYetCreatedDogReminderRecipientRow,
): Promise<void> {
  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogReminderRecipient(reminderUUID, userId) VALUES (?, ?)',
    [notification.reminderUUID, notification.userId],
  );
}

async function createMultipleReminderRecipients(
  databaseConnection: Queryable,
  notifications: NotYetCreatedDogReminderRecipientRow[],
): Promise<void> {
  const promises = notifications.map((n) => createSingleReminderRecipient(databaseConnection, n));
  await Promise.all(promises);
}

export { createSingleReminderRecipient, createMultipleReminderRecipients };
