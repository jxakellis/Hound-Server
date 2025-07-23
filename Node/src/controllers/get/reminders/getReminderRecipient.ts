import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogReminderRecipientColumns, type DogReminderRecipientRow } from '../../../main/types/rows/DogReminderRecipientRow.js';

async function getReminderNotificationUsersForReminderUUID(
  databaseConnection: Queryable,
  reminderUUID: string,
): Promise<DogReminderRecipientRow[]> {
  return databaseQuery<DogReminderRecipientRow[]>(
    databaseConnection,
    `SELECT ${dogReminderRecipientColumns}
           FROM dogReminderRecipient drr
          WHERE drr.reminderUUID = ?
          LIMIT 18446744073709551615`,
    [reminderUUID],
  );
}

async function getReminderNotificationUsersForReminderUUIDs(
  databaseConnection: Queryable,
  reminderUUIDs: string[],
): Promise<DogReminderRecipientRow[]> {
  return databaseQuery<DogReminderRecipientRow[]>(
    databaseConnection,
    `SELECT ${dogReminderRecipientColumns}
           FROM dogReminderRecipient drr
          WHERE drr.reminderUUID IN (?)
          LIMIT 18446744073709551615`,
    [reminderUUIDs],
  );
}

export { getReminderNotificationUsersForReminderUUID, getReminderNotificationUsersForReminderUUIDs };
