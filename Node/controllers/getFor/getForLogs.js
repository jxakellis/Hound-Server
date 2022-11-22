const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatDate } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

// Select every column except for dogId and logLastModified (by not transmitting, increases network efficiency)
// dogId is already known and dogLastModified has no use client-side
// TO DO FUTURE only select logId and logIsDeleted if logIsDeleted = 0, otherwise include all columns
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

  let result = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns} FROM dogLogs WHERE logLastModified >= ? AND logId = ? LIMIT 1`,
      [userConfigurationPreviousDogManagerSynchronization, logId],
    )
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns} FROM dogLogs WHERE logId = ? LIMIT 1`,
      [logId],
    );
  [result] = result;

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
      `SELECT ${dogLogsColumns} FROM dogLogs WHERE logLastModified >= ? AND dogId = ? LIMIT 18446744073709551615`,
      [userConfigurationPreviousDogManagerSynchronization, dogId],
    )
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogLogsColumns} FROM dogLogs WHERE dogId = ? LIMIT 18446744073709551615`,
      [dogId],
    );

  return result;
}

module.exports = { getLogForLogId, getAllLogsForDogId };
