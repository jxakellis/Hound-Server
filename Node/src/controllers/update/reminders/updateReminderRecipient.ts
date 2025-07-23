import { createReminderNotification } from '../../create/reminders/createReminderRecipient.js';
import { getReminderNotificationUsersForReminderUUID } from '../../get/reminders/getReminderRecipient.js';
import { type NotYetUpdatedDogRemindersRow } from '../../../main/types/rows/DogRemindersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function updateReminderNotificationForReminder(
  databaseConnection: Queryable,
  reminder: NotYetUpdatedDogRemindersRow,
): Promise<void> {
  const existing = await getReminderNotificationUsersForReminderUUID(databaseConnection, reminder.reminderUUID);
  const existingUserIds = existing.map((r) => r.userId);
  const newUserIds = reminder.reminderRecipientUserIds;

  const toAdd = newUserIds.filter((u) => !existingUserIds.includes(u));
  const toRemove = existingUserIds.filter((u) => !newUserIds.includes(u));

  const promises: Promise<unknown>[] = [];

  toAdd.forEach((userId) => {
    promises.push(createReminderNotification(databaseConnection, { reminderUUID: reminder.reminderUUID, userId }));
  });

  toRemove.forEach((userId) => {
    promises.push(
      databaseQuery(
        databaseConnection,
        'DELETE FROM dogReminderRecipient WHERE reminderUUID = ? AND userId = ?',
        [reminder.reminderUUID, userId],
      ),
    );
  });

  await Promise.all(promises);
}

async function updateReminderNotificationForReminders(
  databaseConnection: Queryable,
  reminders: NotYetUpdatedDogRemindersRow[],
): Promise<void> {
  const promises = reminders.map((r) => updateReminderNotificationForReminder(databaseConnection, r));
  await Promise.all(promises);
}

export { updateReminderNotificationForReminder, updateReminderNotificationForReminders };
