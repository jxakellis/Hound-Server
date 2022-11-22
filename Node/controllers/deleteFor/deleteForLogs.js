const { ValidationError } = require('../../main/tools/general/errors');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');

/**
 *  Queries the database to delete a log. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteLogForLogId(databaseConnection, dogId, logId) {
  const logLastModified = new Date();

  if (areAllDefined(databaseConnection, dogId, logId) === false) {
    throw new ValidationError('databaseConnection, dogId, or logId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    'UPDATE dogLogs SET logIsDeleted = 1, logLastModified = ? WHERE logId = ?',
    [logLastModified, logId],
  );
}

/**
 *  Queries the database to delete all logs for a dogId. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllLogsForDogId(databaseConnection, dogId) {
  const logLastModified = new Date();

  if (areAllDefined(databaseConnection, dogId) === false) {
    throw new ValidationError('databaseConnection or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    'UPDATE dogLogs SET logIsDeleted = 1, logLastModified = ? WHERE logIsDeleted = 0 AND dogId = ?',
    [logLastModified, dogId],
  );
}

module.exports = { deleteLogForLogId, deleteAllLogsForDogId };
