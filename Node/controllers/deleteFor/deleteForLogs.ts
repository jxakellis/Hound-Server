const { databaseQuery } from '../../main/tools/database/databaseQuery';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/tools/general/errors';

/**
 *  Queries the database to delete a log. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteLogForLogId(databaseConnection, dogId, logId) {
  if (areAllDefined(databaseConnection, dogId, logId) === false) {
    throw new ValidationError('databaseConnection, dogId, or logId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ?`,
    [logId],
  );
}

/**
 *  Queries the database to delete all logs for a dogId. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllLogsForDogId(databaseConnection, dogId) {
  if (areAllDefined(databaseConnection, dogId) === false) {
    throw new ValidationError('databaseConnection or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE logIsDeleted = 0 AND dogId = ?`,
    [dogId],
  );
}

export { deleteLogForLogId, deleteAllLogsForDogId };
