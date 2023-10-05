const { alarmLogger } from '../../logging/loggers';
const { databaseConnectionForAlarms } from '../../database/createDatabaseConnections';
const { databaseQuery } from '../../database/databaseQuery';

const { logServerError } from '../../logging/logServerError';
const { areAllDefined } from '../../validate/validateDefined';
const { cancelJobForFamilyForReminder } from './cancelJob';

async function deleteAlarmNotificationsForFamily(familyId) {
  try {
    alarmLogger.debug(`deleteAlarmNotificationsForFamily ${familyId}`);

    // make sure reminderId is defined
    if (areAllDefined(familyId) === false) {
      return;
    }

    // get all the reminders for the family
    const reminders = await databaseQuery(
      databaseConnectionForAlarms,
      `SELECT reminderId
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE d.dogIsDeleted = 0 AND dr.reminderIsDeleted = 0 AND d.familyId = ? 
      LIMIT 18446744073709551615`,
      [familyId],
    );

    for (let i = 0; i < reminders.length; i += 1) {
      const { reminderId } = reminders[i];
      cancelJobForFamilyForReminder(familyId, reminderId);
    }
  }
  catch (error) {
    logServerError('deleteAlarmNotificationsForFamily', error);
  }
}

/**
 * Cancels and deletes any job scheduled with the provided reminderId
 */
async function deleteAlarmNotificationsForReminder(familyId, reminderId) {
  try {
    alarmLogger.debug(`deleteAlarmNotificationsForReminder ${familyId}, ${reminderId}`);

    // make sure reminderId is defined
    if (areAllDefined(familyId, reminderId) === false) {
      return;
    }

    cancelJobForFamilyForReminder(familyId, reminderId);
  }
  catch (error) {
    logServerError('deleteAlarmNotificationsForReminder', error);
  }
}

export {
  deleteAlarmNotificationsForFamily, deleteAlarmNotificationsForReminder,
};