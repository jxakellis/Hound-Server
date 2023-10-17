import { alarmLogger } from '../../../logging/loggers';
import { databaseConnectionForAlarms } from '../../../database/createDatabaseConnections';
import { databaseQuery } from '../../../database/databaseQuery';

import { logServerError } from '../../../logging/logServerError';
import { cancelJobForFamilyForReminder } from './cancelJob';
import { DogRemindersRow, dogRemindersColumns } from '../../../types/DogRemindersRow';

async function deleteAlarmNotificationsForFamily(familyId: string): Promise<void> {
  try {
    alarmLogger.debug(`deleteAlarmNotificationsForFamily ${familyId}`);

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

    for (let i = 0; i < reminders.length; i += 1) {
      const { reminderId } = reminders[i];
      cancelJobForFamilyForReminder(familyId, reminderId);
    }
  }
  catch (error) {
    logServerError('deleteAlarmNotificationsForFamily', error);
  }
}

/**
 * Cancels and deletes any job scheduled with the provided reminderId
 */
async function deleteAlarmNotificationsForReminder(familyId: string, reminderId: number): Promise<void> {
  try {
    alarmLogger.debug(`deleteAlarmNotificationsForReminder ${familyId}, ${reminderId}`);

    cancelJobForFamilyForReminder(familyId, reminderId);
  }
  catch (error) {
    logServerError('deleteAlarmNotificationsForReminder', error);
  }
}

export {
  deleteAlarmNotificationsForFamily, deleteAlarmNotificationsForReminder,
};
