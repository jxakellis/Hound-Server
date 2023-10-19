import { alarmLogger } from '../../../logging/loggers.js';
import { getDatabaseConnections } from '../../../database/databaseConnections.js';
import { databaseQuery } from '../../../database/databaseQuery.js';

import { logServerError } from '../../../logging/logServerError.js';
import { cancelJobForFamilyForReminder } from './cancelJob.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../../types/DogRemindersRow.js';
import { HoundError } from '../../../server/globalErrors.js';

async function deleteAlarmNotificationsForFamily(familyId: string): Promise<void> {
  try {
    alarmLogger.debug(`deleteAlarmNotificationsForFamily ${familyId}`);

    const { databaseConnectionForAlarms } = await getDatabaseConnections();

    // get all the reminders for the family
    const reminders = await databaseQuery<DogRemindersRow[]>(
      databaseConnectionForAlarms,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE d.dogIsDeleted = 0 AND dr.reminderIsDeleted = 0 AND d.familyId = ? 
      LIMIT 18446744073709551615`,
      [familyId],
    );

    reminders.forEach((reminder) => cancelJobForFamilyForReminder(familyId, reminder.reminderId));
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
 * Cancels and deletes any job scheduled with the provided reminderId
 */
async function deleteAlarmNotificationsForReminder(familyId: string, reminderId: number): Promise<void> {
  cancelJobForFamilyForReminder(familyId, reminderId);
}

export {
  deleteAlarmNotificationsForFamily, deleteAlarmNotificationsForReminder,
};
