const { schedule } = require('./schedule');
const { createAlarmNotificationForFamily } = require('./createAlarmNotification');

const { logServerError } = require('../../logging/logServerError');
const { databaseConnectionForAlarms } = require('../../database/createDatabaseConnections');
const { databaseQuery } = require('../../database/databaseQuery');

/**
 * Assumes an empty schedule
 * Restores all of the notifications for the schedule
 * Use if the schedule gets destroyed (e.g. server crashes/restarts)
 */
async function restoreAlarmNotificationsForAllFamilies() {
  try {
    // remove any pending jobs (there shouldn't be any)
    const jobs = Object.values(schedule.scheduledJobs);
    for (let i = 0; i < jobs.length; i += 1) {
      jobs[i].cancel();
    }

    // for ALL reminders get: familyId, reminderId, dogName, reminderExecutionDate, reminderAction, and reminderCustomActionName
    const remindersWithInfo = await databaseQuery(
      databaseConnectionForAlarms,
      'SELECT dogs.familyId, dogReminders.reminderId, dogReminders.reminderExecutionDate \
FROM dogReminders \
JOIN dogs ON dogs.dogId = dogReminders.dogId \
WHERE dogs.dogIsDeleted = 0 AND dogReminders.reminderIsDeleted = 0 AND dogReminders.reminderExecutionDate IS NOT NULL AND dogReminders.reminderExecutionDate > ? \
LIMIT 18446744073709551615',
      [new Date()],
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

module.exports = {
  restoreAlarmNotificationsForAllFamilies,
};
