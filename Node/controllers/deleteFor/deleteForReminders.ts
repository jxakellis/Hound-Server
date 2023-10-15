import { Queryable, databaseQuery } from '../../main/database/databaseQuery';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { deleteAlarmNotificationsForReminder } from '../../main/tools/notifications/alarm/deleteAlarmNotification';
import { DogRemindersRow, prefixDogRemindersColumns } from '../../main/types/DogRemindersRow';

/**
 *  Queries the database to delete a single reminder. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteReminderForFamilyIdDogIdReminderId(databaseConnection: Queryable, familyId: string, dogId: number, reminderId: number): Promise<void> {
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
async function deleteRemindersForFamilyIdDogIdReminderIds(databaseConnection: Queryable, familyId: string, dogId: number, reminders: Partial<DogRemindersRow>[]): Promise<void> {
  const promises = [];
  for (let i = 0; i < reminders.length; i += 1) {
    const { reminderId } = reminders[i];

    if (reminderId === undefined) {
      throw new HoundError('reminderId missing for deleteReminderForFamilyIdDogIdReminderId', 'deleteRemindersForFamilyIdDogIdReminderIds', ERROR_CODES.VALUE.MISSING);
    }

    promises.push(deleteReminderForFamilyIdDogIdReminderId(databaseConnection, familyId, dogId, reminderId));
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
    `SELECT ${prefixDogRemindersColumns}
    FROM dogReminders dr
    WHERE reminderIsDeleted = 0 AND dogId = ?
    LIMIT 18446744073709551615`,
    [dogId],
  );

  // iterate through all reminders provided to update them all
  // if there is a problem, then we return that problem (function that invokes this will roll back requests)
  // if there are no problems with any of the reminders, we return.
  for (let i = 0; i < reminders.length; i += 1) {
    const { reminderId } = reminders[i];

    // everything here succeeded so we shoot off a request to delete the alarm notification for the reminder
    deleteAlarmNotificationsForReminder(familyId, reminderId);
  }
}

export { deleteReminderForFamilyIdDogIdReminderId, deleteRemindersForFamilyIdDogIdReminderIds, deleteAllRemindersForFamilyIdDogId };
