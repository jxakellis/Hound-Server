const { ValidationError } from '../../main/server/globalErrors';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { databaseQuery } from '../../main/database/databaseQuery';
const {
  formatArray,
} from ''../../main/tools/format/formatObject';

const { deleteAlarmNotificationsForReminder } from '../../main/tools/notifications/alarm/deleteAlarmNotification';

/**
 *  Queries the database to delete a single reminder. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteReminderForFamilyIdDogIdReminderId(databaseConnection, familyId, dogId, reminderId) {
  if (areAllDefined(databaseConnection, familyId, dogId, reminderId) === false) {
    throw new ValidationError('databaseConnection, familyId, dogId, or reminderId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

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
async function deleteRemindersForFamilyIdDogIdReminderIds(databaseConnection, familyId, dogId, forReminders) {
  const reminders = formatArray(forReminders);

  if (areAllDefined(databaseConnection, dogId, reminders) === false) {
    throw new ValidationError('databaseConnection, dogId, or reminders missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [];
  for (let i = 0; i < reminders.length; i += 1) {
    promises.push(deleteReminderForFamilyIdDogIdReminderId(databaseConnection, familyId, dogId, reminders[i].reminderId));
  }
  await Promise.all(promises);

  return reminders;
}

/**
 *  Queries the database to delete all reminders for a dogId. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllRemindersForFamilyIdDogId(databaseConnection, familyId, dogId) {
  if (areAllDefined(databaseConnection, familyId, dogId) === false) {
    throw new ValidationError('databaseConnection, familyId, or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [
    databaseQuery(
      databaseConnection,
      `SELECT reminderId
      FROM dogReminders dr
      WHERE reminderIsDeleted = 0 AND dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    ),
    // deletes reminders
    databaseQuery(
      databaseConnection,
      `UPDATE dogReminders
      SET reminderIsDeleted = 1, reminderLastModified = CURRENT_TIMESTAMP()
      WHERE reminderIsDeleted = 0 AND dogId = ?`,
      [dogId],
    ),
  ];

  const [reminders] = await Promise.all(promises);

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
