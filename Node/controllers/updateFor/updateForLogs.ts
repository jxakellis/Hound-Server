const { databaseQuery } from '../../main/database/databaseQuery';
const { formatDate, formatUnknownString } from '../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/server/globalErrors';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForDogIdLogId(databaseConnection, dogId, logId, forLogDate, logAction, forLogCustomActionName, forLogNote) {
  const logDate = formatDate(forLogDate);
  const logCustomActionName = formatUnknownString(forLogCustomActionName, 32);
  const logNote = formatUnknownString(forLogNote, 500);

  if (areAllDefined(databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, logNote) === false) {
    throw new ValidationError('databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, or logNote missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logDate = ?, logAction = ?, logCustomActionName = ?, logNote = ?, logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ?`,
    [logDate, logAction, logCustomActionName, logNote, logId],
  );
}

export { updateLogForDogIdLogId };
