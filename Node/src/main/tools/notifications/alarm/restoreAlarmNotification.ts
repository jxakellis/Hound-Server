import { schedule } from './schedule';
import { createAlarmNotificationForFamily } from './createAlarmNotification';

import { logServerError } from '../../../logging/logServerError';
import { getDatabaseConnections } from '../../../database/databaseConnections';
import { databaseQuery } from '../../../database/databaseQuery';
import { DogsRow, dogsColumns } from '../../../types/DogsRow';
import { DogRemindersRow, dogRemindersColumns } from '../../../types/DogRemindersRow';
import { HoundError } from '../../../server/globalErrors';

/**
 * Assumes an empty schedule
 * Restores all of the notifications for the schedule
 * Use if the schedule gets destroyed (e.g. server crashes/restarts)
 */
async function restoreAlarmNotificationsForAllFamilies(): Promise<void> {
  try {
    // remove any pending jobs (there shouldn't be any)
    const jobs = Object.values(schedule.scheduledJobs);
    jobs.forEach((job) => job.cancel());

    const { databaseConnectionForAlarms } = await getDatabaseConnections();

    // for ALL reminders get: familyId, reminderId, dogName, reminderExecutionDate, reminderAction, and reminderCustomActionName
    const alarmNotificationInformations = await databaseQuery<(
DogsRow & DogRemindersRow)[]>(
      databaseConnectionForAlarms,
      `SELECT ${dogsColumns}, ${dogRemindersColumns}
      FROM dogReminders dr
      JOIN dogs d ON d.dogId = dr.dogId
      WHERE d.dogIsDeleted = 0
      AND dr.reminderIsDeleted = 0 
      AND dr.reminderExecutionDate IS NOT NULL
      AND TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), dr.reminderExecutionDate) >= 0
      LIMIT 18446744073709551615`,
      );

    // for every reminder that exists (with a valid reminderExecutionDate that is in the future), we invoke createAlarmNotificationForAll for it
    alarmNotificationInformations.forEach((alarmNotificationInformation) => {
      // restore generic alarm for family for given reminder
      // don't use await here as that will significantly slow down process
      createAlarmNotificationForFamily(
        alarmNotificationInformation.familyId,
        alarmNotificationInformation.reminderId,
        alarmNotificationInformation.reminderExecutionDate,
      );
    });
  }
  catch (error) {
    logServerError(
      new HoundError(
        'restoreAlarmNotificationsForAllFamilies',
        restoreAlarmNotificationsForAllFamilies,
        undefined,
        error,
      ),
    );
  }
}

export {
  restoreAlarmNotificationsForAllFamilies,
};
