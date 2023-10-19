import { alarmLogger } from '../../../logging/loggers';
import { getDatabaseConnections } from '../../../database/databaseConnections';
import { databaseQuery } from '../../../database/databaseQuery';

import { logServerError } from '../../../logging/logServerError';
import { cancelJobForFamilyForReminder } from './cancelJob';
import { type DogRemindersRow, dogRemindersColumns } from '../../../types/DogRemindersRow';
import { HoundError } from '../../../server/globalErrors';

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
