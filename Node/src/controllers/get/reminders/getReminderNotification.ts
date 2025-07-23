import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogReminderNotificationColumns, type DogReminderNotificationRow } from '../../../main/types/rows/DogReminderNotificationRow.js';

async function getReminderNotificationUsersForReminderUUID(
  databaseConnection: Queryable,
  reminderUUID: string,
): Promise<DogReminderNotificationRow[]> {
  return databaseQuery<DogReminderNotificationRow[]>(
    databaseConnection,
    `SELECT ${dogReminderNotificationColumns}
           FROM dogReminderNotification drn
          WHERE drn.reminderUUID = ?
          LIMIT 18446744073709551615`,
    [reminderUUID],
  );
}

async function getReminderNotificationUsersForReminderUUIDs(
  databaseConnection: Queryable,
  reminderUUIDs: string[],
): Promise<DogReminderNotificationRow[]> {
  return databaseQuery<DogReminderNotificationRow[]>(
    databaseConnection,
    `SELECT ${dogReminderNotificationColumns}
           FROM dogReminderNotification drn
          WHERE drn.reminderUUID IN (?)
          LIMIT 18446744073709551615`,
    [reminderUUIDs],
  );
}

export { getReminderNotificationUsersForReminderUUID, getReminderNotificationUsersForReminderUUIDs };
