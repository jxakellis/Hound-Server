const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatDate, formatString } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForDogIdLogId(databaseConnection, dogId, logId, forLogDate, logAction, forLogCustomActionName, forLogNote) {
  const logDate = formatDate(forLogDate);
  const logLastModified = new Date();
  const logCustomActionName = formatString(forLogCustomActionName, 32);
  const logNote = formatString(forLogNote, 500);

  if (areAllDefined(databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, logNote) === false) {
    throw new ValidationError('databaseConnection, dogId, logId, logDate, logAction, logCustomActionName, or logNote missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    'UPDATE dogLogs SET logDate = ?, logAction = ?, logCustomActionName = ?, logNote = ?, logLastModified = ? WHERE logId = ?',
    [logDate, logAction, logCustomActionName, logNote, logLastModified, logId],
  );
}

module.exports = { updateLogForDogIdLogId };
