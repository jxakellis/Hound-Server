import { schedule } from './schedule';
import { createAlarmNotificationForFamily } from './createAlarmNotification';

import { logServerError } from '../../../logging/logServerError';
import { databaseConnectionForAlarms } from '../../../database/createDatabaseConnections';
import { databaseQuery } from '../../../database/databaseQuery';
import { DogsRow, prefixDogsColumns } from '../../../types/DogsRow';
import { DogRemindersRow, prefixDogRemindersColumns } from '../../../types/DogRemindersRow';

/**
 * Assumes an empty schedule
 * Restores all of the notifications for the schedule
 * Use if the schedule gets destroyed (e.g. server crashes/restarts)
 */
async function restoreAlarmNotificationsForAllFamilies(): Promise<void> {
  try {
    // remove any pending jobs (there shouldn't be any)
    const jobs = Object.values(schedule.scheduledJobs);
    for (let i = 0; i < jobs.length; i += 1) {
      jobs[i].cancel();
    }

    // for ALL reminders get: familyId, reminderId, dogName, reminderExecutionDate, reminderAction, and reminderCustomActionName
    const remindersWithInfo = await databaseQuery<(
DogsRow & DogRemindersRow)[]>(
      databaseConnectionForAlarms,
      `SELECT ${prefixDogsColumns}, ${prefixDogRemindersColumns}
      FROM dogReminders dr
      JOIN dogs d ON d.dogId = dr.dogId
      WHERE d.dogIsDeleted = 0
      AND dr.reminderIsDeleted = 0 
      AND dr.reminderExecutionDate IS NOT NULL
      AND TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), dr.reminderExecutionDate) >= 0
      LIMIT 18446744073709551615`,
      );

    // for every reminder that exists (with a valid reminderExecutionDate that is in the future), we invoke createAlarmNotificationForAll for it
    for (let i = 0; i < remindersWithInfo.length; i += 1) {
      // get individual information for a family
      const alarmNotificationInformation = remindersWithInfo[i];
      // restore generic alarm for family for given reminder
      // don't use await here as that will significantly slow down process
      createAlarmNotificationForFamily(
        alarmNotificationInformation.familyId,
        alarmNotificationInformation.reminderId,
        alarmNotificationInformation.reminderExecutionDate,
      );
    }
  }
  catch (error) {
    logServerError('restoreAlarmNotificationsForAll', error);
  }
}

export {
  restoreAlarmNotificationsForAllFamilies,
};
