import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { deleteAlarmNotificationsForReminder } from '../../../main/tools/notifications/alarm/deleteAlarmNotification.js';
import { getAllRemindersForDogUUID } from '../../get/reminders/getReminders.js';

/**
 *  Queries the database to delete a single reminder. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteReminderForFamilyIdReminderUUID(databaseConnection: Queryable, familyId: string, reminderUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderIsDeleted = 1, reminderLastModified = CURRENT_TIMESTAMP()
    WHERE reminderUUID = ? AND reminderIsDeleted = 0`,
    [reminderUUID],
  );

  // everything here succeeded so we shoot off a request to delete the alarm notification for the reminder
  deleteAlarmNotificationsForReminder(familyId, reminderUUID);
}

/**
 *  Queries the database to delete multiple reminders. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function deleteRemindersForFamilyIdReminderUUIDs(databaseConnection: Queryable, familyId: string, reminderUUIDs: string[]): Promise<void> {
  const promises = [];
  for (let i = 0; i < reminderUUIDs.length; i += 1) {
    promises.push(deleteReminderForFamilyIdReminderUUID(databaseConnection, familyId, reminderUUIDs[i]));
  }

  await Promise.all(promises);
}

/**
 *  Queries the database to delete all reminders for a dogUUID. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllRemindersForFamilyIdDogUUID(databaseConnection: Queryable, familyId: string, dogUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderIsDeleted = 1, reminderLastModified = CURRENT_TIMESTAMP()
    WHERE dogUUID = ? AND reminderIsDeleted = 0`,
    [dogUUID],
  );

  const notDeletedReminders = await getAllRemindersForDogUUID(databaseConnection, dogUUID, false);

  // iterate through all reminders provided to update them all
  // if there is a problem, then we return that problem (function that invokes this will roll back requests)
  // if there are no problems with any of the reminders, we return.
  notDeletedReminders.forEach((notDeletedReminder) => deleteAlarmNotificationsForReminder(familyId, notDeletedReminder.reminderUUID));
}

export { deleteRemindersForFamilyIdReminderUUIDs, deleteAllRemindersForFamilyIdDogUUID };
