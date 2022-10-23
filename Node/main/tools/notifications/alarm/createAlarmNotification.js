const { alarmLogger } = require('../../logging/loggers');
const { databaseConnectionForAlarms } = require('../../database/createDatabaseConnections');
const { databaseQuery } = require('../../database/databaseQuery');

const { schedule } = require('./schedule');

const { formatDate } = require('../../format/formatObject');
const { areAllDefined } = require('../../format/validateDefined');
const { sendNotificationForFamily } = require('../apn/sendNotification');

const { logServerError } = require('../../logging/logServerError');
const { deleteAlarmNotificationsForReminder } = require('./deleteAlarmNotification');
const { formatReminderAction } = require('../../format/formatName');

/**
 * For a given reminder for a given family, handles the alarm notifications
 * If the reminderExecutionDate is in the past, sends APN notification asap. Otherwise, schedule job to send at reminderExecutionDate.
 * If a job with that name from reminderId already exists, then we cancel and replace that job
 */
async function createAlarmNotificationForFamily(familyId, reminderId, reminderExecutionDate) {
  try {
    // all ids should already be formatted into numbers
    const formattedReminderExecutionDate = formatDate(reminderExecutionDate);
    alarmLogger.debug(`createAlarmNotificationForFamily ${familyId}, ${reminderId}, ${reminderExecutionDate}, ${formattedReminderExecutionDate}`);

    if (areAllDefined(familyId, reminderId) === false) {
      return;
    }

    // We are potentially overriding a job, so we must cancel it first
    await deleteAlarmNotificationsForReminder(familyId, reminderId);

    // If a user updates a reminder, this function is invoked. When a reminder is updated, is reminderExecutionDate can be undefined
    // Therefore we want to delete the old alarm notifications for that reminder and (if it has a reminderExecutionDate) create new alarm notifications
    if (areAllDefined(formattedReminderExecutionDate) === false) {
      return;
    }
    // The date that is further in the future is greater
    // Therefore, if the the present is greater than reminderExecutionDate, that means the reminderExecutionDate is older than the present.

    // reminderExecutionDate is present or in the past, so we should execute immediately
    if (new Date() >= formattedReminderExecutionDate) {
      // do these async, no need to await
      sendAPNNotificationForFamily(familyId, reminderId);
    }
    // reminderExecutionDate is in the future
    else {
      alarmLogger.info(`Scheduling a new job; count will be ${Object.keys(schedule.scheduledJobs).length + 1}`);
      schedule.scheduleJob(`Family${familyId}Reminder${reminderId}`, formattedReminderExecutionDate, async () => {
        // do these async, no need to await
        sendAPNNotificationForFamily(familyId, reminderId);
      });
    }
  }
  catch (error) {
    logServerError('createAlarmNotificationForFamily', error);
  }
}

/**
 * Helper method for createAlarmNotificationForFamily, actually queries database to get most updated version of dog and reminder.
 * Physically sends the APN
 */
async function sendAPNNotificationForFamily(familyId, reminderId) {
  try {
    // get the dogName, reminderAction, and reminderCustomActionName for the given reminderId
    // the reminderId has to exist to search and we check to make sure the dogId isn't null (to make sure the dog still exists too)
    let reminder = await databaseQuery(
      databaseConnectionForAlarms,
      'SELECT dogs.dogName, dogReminders.reminderId, dogReminders.reminderExecutionDate, dogReminders.reminderAction, dogReminders.reminderCustomActionName, dogReminders.reminderLastModified, dogReminders.snoozeExecutionInterval FROM dogReminders JOIN dogs ON dogReminders.dogId = dogs.dogId WHERE dogs.dogIsDeleted = 0 AND dogReminders.reminderIsDeleted = 0 AND dogReminders.reminderId = ? AND dogReminders.reminderExecutionDate IS NOT NULL AND dogs.dogId IS NOT NULL LIMIT 18446744073709551615',
      [reminderId],
    );
    [reminder] = reminder;

    // Check to make sure the required information of the reminder exists
    if (areAllDefined(reminder, reminder.dogName, reminder.reminderId, reminder.reminderAction) === false) {
      return;
    }

    // Maximum possible length of message: 2 (raw) + 32 (variable) = 34 (> ALERT_TITLE_LIMIT)
    const alertTitle = `⏱ ${reminder.dogName}`;
    // `Reminder for ${reminder.dogName}`;

    // Maximum possible length of message: 19 (raw) + 32 (variable) = 51 (<= ALERT_BODY_LIMIT)
    let alertBody = `Lend a hand with '${formatReminderAction(reminder.reminderAction, reminder.reminderCustomActionName)}'`;

    const snoozeExecutionInterval = formatDate(reminder.snoozeExecutionInterval);
    if (areAllDefined(snoozeExecutionInterval)) {
      // Maximum possible length of message: 47 (raw) + 32 (variable) = 79 (<= ALERT_BODY_LIMIT)
      alertBody = `It's been a bit, remember to lend a hand with '${formatReminderAction(reminder.reminderAction, reminder.reminderCustomActionName)}'`;
    }

    // send immediate APN notification for family
    const customPayload = { reminderId: reminder.reminderId, reminderLastModified: reminder.reminderLastModified };
    sendNotificationForFamily(familyId, global.constant.notification.category.reminder.PRIMARY, alertTitle, alertBody, customPayload);
  }
  catch (error) {
    logServerError('sendAPNNotificationForFamily', error);
  }
}

// Don't export sendAPNNotificationForFamily as they are helper methods
module.exports = {
  createAlarmNotificationForFamily,
};
