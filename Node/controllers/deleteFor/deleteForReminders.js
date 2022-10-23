const { ValidationError } = require('../../main/tools/general/errors');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatArray,
} = require('../../main/tools/format/formatObject');

const { deleteAlarmNotificationsForReminder } = require('../../main/tools/notifications/alarm/deleteAlarmNotification');

/**
 *  Queries the database to delete a single reminder. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteReminderForFamilyIdDogIdReminderId(databaseConnection, familyId, dogId, reminderId) {
  const reminderLastModified = new Date();

  if (areAllDefined(databaseConnection, familyId, dogId, reminderId) === false) {
    throw new ValidationError('databaseConnection, familyId, dogId, or reminderId missing', global.constant.error.value.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    'UPDATE dogReminders SET reminderIsDeleted = 1, reminderLastModified = ? WHERE reminderId = ?',
    [reminderLastModified, reminderId],
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
    throw new ValidationError('databaseConnection, dogId, or reminders missing', global.constant.error.value.MISSING);
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
  const reminderLastModified = new Date();

  if (areAllDefined(databaseConnection, familyId, dogId) === false) {
    throw new ValidationError('databaseConnection, familyId, or dogId missing', global.constant.error.value.MISSING);
  }

  const promises = [
    databaseQuery(
      databaseConnection,
      'SELECT reminderId FROM dogReminders WHERE reminderIsDeleted = 0 AND dogId = ? LIMIT 18446744073709551615',
      [dogId],
    ),
    // deletes reminders
    databaseQuery(
      databaseConnection,
      'UPDATE dogReminders SET reminderIsDeleted = 1, reminderLastModified = ? WHERE reminderIsDeleted = 0 AND dogId = ?',
      [reminderLastModified, dogId],
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

module.exports = { deleteReminderForFamilyIdDogIdReminderId, deleteRemindersForFamilyIdDogIdReminderIds, deleteAllRemindersForFamilyIdDogId };
