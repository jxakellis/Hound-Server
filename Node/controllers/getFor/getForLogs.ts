const { databaseQuery } from '../../main/tools/database/databaseQuery';
const { formatDate } from '../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/tools/general/errors';

// OMITTED (not necessary): dogId and logLastModified
const dogLogsColumns = 'logId, userId, logDate, logNote, logAction, logCustomActionName, logIsDeleted';

/**
 *  If the query is successful, returns the log for the dogId.
 *  If a problem is encountered, creates and throws custom error
*/
async function getLogForLogId(databaseConnection, logId, forUserConfigurationPreviousDogManagerSynchronization) {
  if (areAllDefined(databaseConnection, logId) === false) {
    throw new ValidationError('databaseConnection or logId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  const userConfigurationPreviousDogManagerSynchronization = formatDate(forUserConfigurationPreviousDogManagerSynchronization);

  const [result] = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE TIMESTAMPDIFF(MICROSECOND, logLastModified, ?) <= 0 AND logId = ?
      LIMIT 1`,
      [userConfigurationPreviousDogManagerSynchronization, logId],
    )
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE logId = ?
      LIMIT 1`,
      [logId],
    );

  return result;
}

/**
 *  If the query is successful, returns an array of all the logs for the dogId. Errors not handled
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllLogsForDogId(databaseConnection, dogId, forUserConfigurationPreviousDogManagerSynchronization) {
  if (areAllDefined(databaseConnection, dogId) === false) {
    throw new ValidationError('databaseConnection or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationPreviousDogManagerSynchronization = formatDate(forUserConfigurationPreviousDogManagerSynchronization);

  const result = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE TIMESTAMPDIFF(MICROSECOND, logLastModified, ?) <= 0 AND dogId = ?
      LIMIT 18446744073709551615`,
      [userConfigurationPreviousDogManagerSynchronization, dogId],
    )
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    );

  return result;
}

export { getLogForLogId, getAllLogsForDogId };
