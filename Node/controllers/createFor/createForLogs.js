const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { ValidationError } = require('../../main/tools/general/errors');
const { formatDate, formatString } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

/**
 *  Queries the database to create a log. If the query is successful, then returns the logId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createLogForUserIdDogId(databaseConnection, userId, dogId, forLogDate, logAction, forLogCustomActionName, forLogNote) {
  const logDate = formatDate(forLogDate);
  const logLastModified = new Date();
  const logCustomActionName = formatString(forLogCustomActionName, 32);
  const logNote = formatString(forLogNote, 500);

  if (areAllDefined(databaseConnection, userId, dogId, logDate, logAction, logCustomActionName, logNote) === false) {
    throw new ValidationError('databaseConnection, userId, dogId, logDate, logAction, logCustomActionName, or logNote missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // only retrieve enough not deleted logs that would exceed the limit
  const logs = await databaseQuery(
    databaseConnection,
    'SELECT 1 FROM dogLogs WHERE logIsDeleted = 0 AND dogId = ? LIMIT ?',
    [dogId, global.CONSTANT.LIMIT.NUMBER_OF_LOGS_PER_DOG],
  );

  // make sure that the user isn't creating too many logs
  if (logs.length >= global.CONSTANT.LIMIT.NUMBER_OF_LOGS_PER_DOG) {
    throw new ValidationError(`Dog log limit of ${global.CONSTANT.LIMIT.NUMBER_OF_LOGS_PER_DOG} exceeded`, global.CONSTANT.ERROR.FAMILY.LIMIT.LOG_TOO_LOW);
  }

  const result = await databaseQuery(
    databaseConnection,
    'INSERT INTO dogLogs(userId, dogId, logDate, logNote, logAction, logCustomActionName, logLastModified) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, dogId, logDate, logNote, logAction, logCustomActionName, logLastModified],
  );

  return result.insertId;
}

module.exports = { createLogForUserIdDogId };
