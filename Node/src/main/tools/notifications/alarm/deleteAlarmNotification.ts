import { alarmLogger } from '../../../logging/loggers.js';
import { DatabasePools, getPoolConnection } from '../../../database/databaseConnections.js';
import { databaseQuery } from '../../../database/databaseQuery.js';

import { logServerError } from '../../../logging/logServerError.js';
import { cancelJobForFamilyForReminder } from './cancelJob.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../../types/rows/DogRemindersRow.js';
import { HoundError } from '../../../server/globalErrors.js';

async function deleteAlarmNotificationsForFamily(familyId: string): Promise<void> {
  try {
    alarmLogger.debug(`deleteAlarmNotificationsForFamily ${familyId}`);

    // This pool connection is obtained manually here. Therefore we must also release it manually.
    // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
    const generalPoolConnection = await getPoolConnection(DatabasePools.general);

    // get all the reminders for the family
    const reminders = await databaseQuery<DogRemindersRow[]>(
      generalPoolConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      JOIN dogs d ON dr.dogUUID = d.dogUUID
      WHERE d.familyId = ? AND d.dogIsDeleted = 0 AND dr.reminderIsDeleted = 0 
      LIMIT 18446744073709551615`,
      [familyId],
    ).finally(() => {
      generalPoolConnection.release();
    });

    reminders.forEach((reminder) => cancelJobForFamilyForReminder(familyId, reminder.reminderUUID));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'deleteAlarmNotificationsForFamily',
        deleteAlarmNotificationsForFamily,
        undefined,
        error,
      ),
    );
  }
}

/**
 * Cancels and deletes any job scheduled with the provided reminderUUID
 */
async function deleteAlarmNotificationsForReminder(familyId: string, reminderUUID: string): Promise<void> {
  cancelJobForFamilyForReminder(familyId, reminderUUID);
}

export {
  deleteAlarmNotificationsForFamily, deleteAlarmNotificationsForReminder,
};
