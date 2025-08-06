import { createSingleReminderRecipient } from '../../create/reminders/createReminderRecipient.js';
import { getReminderNotificationUsersForReminderUUID } from '../../get/reminders/getReminderRecipient.js';
import { type NotYetUpdatedDogRemindersRow } from '../../../main/types/rows/DogRemindersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function updateReminderRecipientForReminder(
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
    promises.push(createSingleReminderRecipient(databaseConnection, { reminderUUID: reminder.reminderUUID, userId }));
  });

  toRemove.forEach((userId) => {
    promises.push(
      databaseQuery(
        databaseConnection,
        'DELETE dogReminderRecipient WHERE reminderUUID = ? AND userId = ?',
        [reminder.reminderUUID, userId],
      ),
    );
  });

  await Promise.all(promises);
}

async function updateReminderRecipientForReminders(
  databaseConnection: Queryable,
  reminders: NotYetUpdatedDogRemindersRow[],
): Promise<void> {
  const promises = reminders.map((r) => updateReminderRecipientForReminder(databaseConnection, r));
  await Promise.all(promises);
}

export { updateReminderRecipientForReminder, updateReminderRecipientForReminders };
