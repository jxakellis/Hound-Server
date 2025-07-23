import { databaseQuery } from '../../../main/database/databaseQuery.js';
import type { Queryable } from '../../../main/types/Queryable.js';

async function removeUserFromAllReminderNotifications(
  databaseConnection: Queryable,
  familyId: string,
  userId: string,
): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `DELETE drr
       FROM dogReminderRecipient drr
       JOIN dogReminders dr ON drr.reminderUUID = dr.reminderUUID
       JOIN dogs d ON dr.dogUUID = d.dogUUID
      WHERE d.familyId = ? AND drr.userId = ?`,
    [familyId, userId],
  );
}

export { removeUserFromAllReminderNotifications };
