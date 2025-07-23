import { createReminderNotifications } from '../../create/reminders/createReminderRecipient.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function addUserToAllReminderNotifications(
  databaseConnection: Queryable,
  familyId: string,
  userId: string,
): Promise<void> {
  const reminders = await databaseQuery<{ reminderUUID: string }[]>(
    databaseConnection,
    `SELECT dr.reminderUUID
       FROM dogReminders dr
       JOIN dogs d ON dr.dogUUID = d.dogUUID
      WHERE d.familyId = ? AND dr.reminderIsDeleted = 0`,
    [familyId],
  );

  const notifications = reminders.map((r) => ({ reminderUUID: r.reminderUUID, userId }));
  await createReminderNotifications(databaseConnection, notifications);
}

export { addUserToAllReminderNotifications };
