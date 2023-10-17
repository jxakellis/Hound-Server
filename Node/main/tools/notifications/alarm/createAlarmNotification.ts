import { alarmLogger } from '../../../logging/loggers';
import { databaseConnectionForAlarms } from '../../../database/createDatabaseConnections';
import { databaseQuery } from '../../../database/databaseQuery';

import { schedule } from './schedule';

import { sendNotificationForFamily } from '../apn/sendNotification';

import { logServerError } from '../../../logging/logServerError';
import { deleteAlarmNotificationsForReminder } from './deleteAlarmNotification';
import { formatReminderAction } from '../../../format/formatName';
import { DogsRow, dogsColumns } from '../../../types/DogsRow';
import { DogRemindersRow, dogRemindersColumns } from '../../../types/DogRemindersRow';
import { NOTIFICATION } from '../../../server/globalConstants';

/**
 * Helper method for createAlarmNotificationForFamily, actually queries database to get most updated version of dog and reminder.
 * Physically sends the APN
 */
async function sendAPNNotificationForFamily(familyId: string, reminderId: number): Promise<void> {
  try {
    // get the dogName, reminderAction, and reminderCustomActionName for the given reminderId
    // the reminderId has to exist to search and we check to make sure the dogId isn't null (to make sure the dog still exists too)
    const result = await databaseQuery<(
DogsRow & DogRemindersRow)[]>(
      databaseConnectionForAlarms,
      `SELECT ${dogsColumns}, ${dogRemindersColumns}
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE d.dogIsDeleted = 0 AND dr.reminderIsDeleted = 0 AND dr.reminderId = ? AND dr.reminderExecutionDate IS NOT NULL AND d.dogId IS NOT NULL
      LIMIT 1`,
      [reminderId],
      );

    const reminder = result.safeIndex(0);

    // Check to make sure the required information of the reminder exists
    if (reminder === undefined) {
      return;
    }

    // Maximum possible length of message: 2 (raw) + 32 (variable) = 34 (> ALERT_TITLE_LIMIT)
    const alertTitle = `⏱ ${reminder.dogName}`;
    // `Reminder for ${reminder.dogName}`;

    // Maximum possible length of message: 17 (raw) + 32 (variable) = 49 (<= ALERT_BODY_LIMIT)
    let alertBody = `Lend a hand with ${formatReminderAction(reminder.reminderAction, reminder.reminderCustomActionName)}`;

    if (reminder.snoozeExecutionInterval !== undefined) {
      // Maximum possible length of message: 45 (raw) + 32 (variable) = 77 (<= ALERT_BODY_LIMIT)
      alertBody = `It's been a bit, remember to lend a hand with ${formatReminderAction(reminder.reminderAction, reminder.reminderCustomActionName)}`;
    }

    // send immediate APN notification for family
    const customPayload = { reminderId, reminderLastModified: reminder.reminderLastModified };
    sendNotificationForFamily(familyId, NOTIFICATION.CATEGORY.REMINDER.ALARM, alertTitle, alertBody, customPayload);
  }
  catch (error) {
    logServerError('sendAPNNotificationForFamily', error);
  }
}

/**
 * For a given reminder for a given family, handles the alarm notifications
 * If the reminderExecutionDate is in the past, sends APN notification asap. Otherwise, schedule job to send at reminderExecutionDate.
 * If a job with that name from reminderId already exists, then we cancel and replace that job
 */
async function createAlarmNotificationForFamily(familyId: string, reminderId: number, reminderExecutionDate?: Date): Promise<void> {
  try {
    alarmLogger.debug(`createAlarmNotificationForFamily ${familyId}, ${reminderId}, ${reminderExecutionDate}, ${reminderExecutionDate}`);

    // We are potentially overriding a job, so we must cancel it first
    await deleteAlarmNotificationsForReminder(familyId, reminderId);

    // If a user updates a reminder, this function is invoked. When a reminder is updated, is reminderExecutionDate can be null
    // Therefore we want to delete the old alarm notifications for that reminder and (if it has a reminderExecutionDate) create new alarm notifications
    if (reminderExecutionDate === undefined) {
      return;
    }
    // The date that is further in the future is greater
    // Therefore, if the the present is greater than reminderExecutionDate, that means the reminderExecutionDate is older than the present.

    // reminderExecutionDate is present or in the past, so we should execute immediately
    if (new Date() >= reminderExecutionDate) {
      // do these async, no need to await
      sendAPNNotificationForFamily(familyId, reminderId);
    }
    // reminderExecutionDate is in the future
    else {
      alarmLogger.debug(`Scheduling a new job; count will be ${Object.keys(schedule.scheduledJobs).length + 1}`);
      schedule.scheduleJob(`Family${familyId}Reminder${reminderId}`, reminderExecutionDate, async () => {
        // do these async, no need to await
        sendAPNNotificationForFamily(familyId, reminderId);
      });
    }
  }
  catch (error) {
    logServerError('createAlarmNotificationForFamily', error);
  }
}

// Don't export sendAPNNotificationForFamily as they are helper methods
export {
  createAlarmNotificationForFamily,
};
