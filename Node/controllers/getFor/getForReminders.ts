const { databaseQuery } from '../../main/tools/database/databaseQuery';
const { formatDate } from '../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/tools/general/errors';

// OMITTED (not necessary): dogId, reminderExecutionDate, reminderLastModified
const dogRemindersColumns = `reminderId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, 
reminderExecutionBasis, reminderIsDeleted, snoozeExecutionInterval, countdownExecutionInterval, weeklyUTCHour, 
weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday,
weeklySkippedDate, monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, monthlySkippedDate, oneTimeDate`;

/**
 *  If the query is successful, returns the reminder for the reminderId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getReminderForReminderId(databaseConnection, reminderId, forUserConfigurationPreviousDogManagerSynchronization) {
  if (areAllDefined(databaseConnection, reminderId) === false) {
    throw new ValidationError('databaseConnection or reminderId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationPreviousDogManagerSynchronization = formatDate(forUserConfigurationPreviousDogManagerSynchronization);

  const [result] = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE TIMESTAMPDIFF(MICROSECOND, reminderLastModified, ?) <= 0 AND reminderId = ?
      LIMIT 1`,
      [userConfigurationPreviousDogManagerSynchronization, reminderId],
    )
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE reminderId = ?
      LIMIT 1`,
      [reminderId],
    );

  // don't trim 'unnecessary' components (e.g. if weekly only send back weekly components)
  // its unnecessary processing and its easier for the reminders to remember their old states
  return result;
}

/**
 *  If the query is successful, returns an array of all the reminders for the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllRemindersForDogId(databaseConnection, dogId, forUserConfigurationPreviousDogManagerSynchronization) {
  if (areAllDefined(databaseConnection, dogId) === false) {
    throw new ValidationError('databaseConnection or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationPreviousDogManagerSynchronization = formatDate(forUserConfigurationPreviousDogManagerSynchronization);

  const result = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE TIMESTAMPDIFF(MICROSECOND, reminderLastModified, ?) <= 0 AND dogId = ?
      LIMIT 18446744073709551615`,
      [userConfigurationPreviousDogManagerSynchronization, dogId],
    )
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
      FROM dogReminders dr
      WHERE dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    );

  // don't trim 'unnecessary' components (e.g. if weekly only send back weekly components)
  // its unnecessary processing and its easier for the reminders to remember their old states
  return result;
}

export { getReminderForReminderId, getAllRemindersForDogId };
