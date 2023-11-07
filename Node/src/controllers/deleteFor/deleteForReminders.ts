import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { deleteAlarmNotificationsForReminder } from '../../main/tools/notifications/alarm/deleteAlarmNotification.js';
import { getAllRemindersForDogId } from '../getFor/getForReminders.js';

/**
 *  Queries the database to delete a single reminder. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteReminderForFamilyIdDogIdReminderId(databaseConnection: Queryable, familyId: string, reminderId: number): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderIsDeleted = 1, reminderLastModified = CURRENT_TIMESTAMP()
    WHERE reminderId = ? AND reminderIsDeleted = 0`,
    [reminderId],
  );

  // everything here succeeded so we shoot off a request to delete the alarm notification for the reminder
  deleteAlarmNotificationsForReminder(familyId, reminderId);
}

/**
 *  Queries the database to delete multiple reminders. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function deleteRemindersForFamilyIdDogIdReminderIds(databaseConnection: Queryable, familyId: string, reminderIds: number[]): Promise<void> {
  const promises = [];
  for (let i = 0; i < reminderIds.length; i += 1) {
    promises.push(deleteReminderForFamilyIdDogIdReminderId(databaseConnection, familyId, reminderIds[i]));
  }

  await Promise.all(promises);
}

/**
 *  Queries the database to delete all reminders for a dogId. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllRemindersForFamilyIdDogId(databaseConnection: Queryable, familyId: string, dogId: number): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderIsDeleted = 1, reminderLastModified = CURRENT_TIMESTAMP()
    WHERE dogId = ? AND reminderIsDeleted = 0`,
    [dogId],
  );

  const notDeletedReminders = await getAllRemindersForDogId(databaseConnection, dogId, false);

  // iterate through all reminders provided to update them all
  // if there is a problem, then we return that problem (function that invokes this will roll back requests)
  // if there are no problems with any of the reminders, we return.
  notDeletedReminders.forEach((notDeletedReminder) => deleteAlarmNotificationsForReminder(familyId, notDeletedReminder.reminderId));
}

export { deleteRemindersForFamilyIdDogIdReminderIds, deleteAllRemindersForFamilyIdDogId };
