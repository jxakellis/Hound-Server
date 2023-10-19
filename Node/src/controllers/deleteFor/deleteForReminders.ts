import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { deleteAlarmNotificationsForReminder } from '../../main/tools/notifications/alarm/deleteAlarmNotification.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../main/types/DogRemindersRow.js';

/**
 *  Queries the database to delete a single reminder. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteReminderForFamilyIdDogIdReminderId(databaseConnection: Queryable, familyId: string, reminderId: number): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogReminders
    SET reminderIsDeleted = 1, reminderLastModified = CURRENT_TIMESTAMP()
    WHERE reminderId = ?`,
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
    WHERE reminderIsDeleted = 0 AND dogId = ?`,
    [dogId],
  );

  const reminders = await databaseQuery<DogRemindersRow[]>(
    databaseConnection,
    `SELECT ${dogRemindersColumns}
    FROM dogReminders dr
    WHERE reminderIsDeleted = 0 AND dogId = ?
    LIMIT 18446744073709551615`,
    [dogId],
  );

  // iterate through all reminders provided to update them all
  // if there is a problem, then we return that problem (function that invokes this will roll back requests)
  // if there are no problems with any of the reminders, we return.
  reminders.forEach((reminder) => deleteAlarmNotificationsForReminder(familyId, reminder.reminderId));
}

export { deleteRemindersForFamilyIdDogIdReminderIds, deleteAllRemindersForFamilyIdDogId };
