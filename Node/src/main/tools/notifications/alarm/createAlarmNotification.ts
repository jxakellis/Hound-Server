import { getReminderNotificationUsersForReminderUUID } from '../../../../controllers/get/reminders/getReminderNotification.js';
import { getAllReminderActionTypes } from '../../../../controllers/get/types/getReminderActionType.js';
import { alarmLogger } from '../../../logging/loggers.js';
import { DatabasePools, getPoolConnection } from '../../../database/databaseConnections.js';
import { databaseQuery } from '../../../database/databaseQuery.js';

import { schedule } from './schedule.js';

import { sendNotificationForFamilyMembers } from '../apn/sendNotification.js';

import { logServerError } from '../../../logging/logServerError.js';
import { deleteAlarmNotificationsForReminder } from './deleteAlarmNotification.js';
import { convertActionTypeToFinalReadable } from '../../../format/formatActionType.js';
import { type DogsRow, dogsColumns } from '../../../types/rows/DogsRow.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../../types/rows/DogRemindersRow.js';
import { NOTIFICATION } from '../../../server/globalConstants.js';
import { HoundError } from '../../../server/globalErrors.js';

/**
 * Helper method for createAlarmNotificationForFamily, actually queries database to get most updated version of dog and reminder.
 * Physically sends the APN
 */
async function sendAPNNotificationForFamily(familyId: string, reminderUUID: string): Promise<void> {
  try {
    // This pool connection is obtained manually here. Therefore we must also release it manually.
    // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
    const generalPoolConnection = await getPoolConnection(DatabasePools.general);

    const [reminderActionTypes, reminders] = await Promise.all([
      getAllReminderActionTypes(generalPoolConnection),
      // get the dogName, reminderAction, and reminderCustomActionName for the given reminderUUID
      // the reminderUUID has to exist to search and we check to make sure the dogUUID isn't null (to make sure the dog still exists too)
      databaseQuery<(
        DogsRow & DogRemindersRow)[]>(
        generalPoolConnection,
        `SELECT ${dogsColumns}, ${dogRemindersColumns}
              FROM dogReminders dr
              JOIN dogs d ON dr.dogUUID = d.dogUUID
              WHERE d.dogUUID IS NOT NULL AND dr.reminderUUID = ? AND d.dogIsDeleted = 0 AND dr.reminderIsDeleted = 0 AND dr.reminderExecutionDate IS NOT NULL 
              LIMIT 1`,
        [reminderUUID],
        ),
    ]).finally(() => {
      generalPoolConnection.release();
    });

    const reminder = reminders.safeIndex(0);

    // Check to make sure the required information of the reminder exists
    if (reminder === undefined || reminder === null) {
      return;
    }

    // Maximum possible length of message: 2 (raw) + 32 (variable) = 34 (> ALERT_TITLE_LIMIT)
    const alertTitle = `⏱ ${reminder.dogName}`;

    const reminderAction = reminderActionTypes.find((rat) => rat.reminderActionTypeId === reminder.reminderActionTypeId);

    if (reminderAction === undefined) {
      throw new Error(`Reminder action type ${reminder.reminderActionTypeId} not found`);
    }

    // Maximum possible length of message: 17 (raw) + 32 (variable) = 49 (<= ALERT_BODY_LIMIT)
    let alertBody = `Lend a hand with ${convertActionTypeToFinalReadable(reminderAction, true, reminder.reminderCustomActionName)}`;

    if (reminder.snoozeExecutionInterval !== undefined && reminder.snoozeExecutionInterval !== null) {
      // Maximum possible length of message: 45 (raw) + 32 (variable) = 77 (<= ALERT_BODY_LIMIT)
      alertBody = `It's been a bit, remember to lend a hand with ${convertActionTypeToFinalReadable(reminderAction, true, reminder.reminderCustomActionName)}`;
    }

    const notificationRows = await getReminderNotificationUsersForReminderUUID(generalPoolConnection, reminderUUID);
    const userIds = notificationRows.map((n) => n.userId);

    // send immediate APN notification for family
    const customPayload = { reminderUUID, reminderLastModified: reminder.reminderLastModified };

    if (userIds.length > 0) {
      sendNotificationForFamilyMembers(familyId, userIds, NOTIFICATION.CATEGORY.REMINDER.ALARM, alertTitle, alertBody, customPayload);
    }
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendAPNNotificationForFamily',
        sendAPNNotificationForFamily,
        undefined,
        error,
      ),
    );
  }
}

/**
 * For a given reminder for a given family, handles the alarm notifications
 * If the reminderExecutionDate is in the past, sends APN notification asap. Otherwise, schedule job to send at reminderExecutionDate.
 * If a job with that name from reminderUUID already exists, then we cancel and replace that job
 */
async function createAlarmNotificationForFamily(familyId: string, reminderUUID: string, reminderExecutionDate?: Date): Promise<void> {
  try {
    alarmLogger.debug(`createAlarmNotificationForFamily ${familyId}, ${reminderUUID}, ${reminderExecutionDate}, ${reminderExecutionDate}`);

    // We are potentially overriding a job, so we must cancel it first
    await deleteAlarmNotificationsForReminder(familyId, reminderUUID);

    // If a user updates a reminder, this function is invoked. When a reminder is updated, is reminderExecutionDate can be null
    // Therefore we want to delete the old alarm notifications for that reminder and (if it has a reminderExecutionDate) create new alarm notifications
    if (reminderExecutionDate === undefined || reminderExecutionDate === null) {
      return;
    }
    // The date that is further in the future is greater
    // Therefore, if the the present is greater than reminderExecutionDate, that means the reminderExecutionDate is older than the present.

    // reminderExecutionDate is present or in the past, so we should execute immediately
    if (new Date() >= reminderExecutionDate) {
      // do these async, no need to await
      sendAPNNotificationForFamily(familyId, reminderUUID);
    }
    // reminderExecutionDate is in the future
    else {
      alarmLogger.debug(`Scheduling a new job; count will be ${Object.keys(schedule.scheduledJobs).length + 1}`);
      schedule.scheduleJob(`Family${familyId}Reminder${reminderUUID}`, reminderExecutionDate, async () => {
        // do these async, no need to await
        sendAPNNotificationForFamily(familyId, reminderUUID);
      });
    }
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createAlarmNotificationForFamily',
        createAlarmNotificationForFamily,
        undefined,
        error,
      ),
    );
  }
}

// Don't export sendAPNNotificationForFamily as they are helper methods
export {
  createAlarmNotificationForFamily,
};
