import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { LIMIT } from '../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { type DogLogsRow, dogLogsColumns, type NotYetCreatedDogLogsRow } from '../../main/types/DogLogsRow.js';

/**
*  Queries the database to create a log. If the query is successful, then returns the logId.
*  If a problem is encountered, creates and throws custom error
*/
async function createLogForUserIdDogId(databaseConnection: Queryable, log: NotYetCreatedDogLogsRow): Promise<number> {
  // only retrieve enough not deleted logs that would exceed the limit
  const logs = await databaseQuery<DogLogsRow[]>(
    databaseConnection,
    `SELECT ${dogLogsColumns}
    FROM dogLogs dl
    WHERE logIsDeleted = 0 AND dogId = ?
    LIMIT ?`,
    [log.dogId, LIMIT.NUMBER_OF_LOGS_PER_DOG],
  );

  // make sure that the user isn't creating too many logs
  if (logs.length >= LIMIT.NUMBER_OF_LOGS_PER_DOG) {
    throw new HoundError(`Dog log limit of ${LIMIT.NUMBER_OF_LOGS_PER_DOG} exceeded`, createLogForUserIdDogId, ERROR_CODES.FAMILY.LIMIT.LOG_TOO_LOW);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogLogs
      (
        dogId, userId,
        logDate, logNote, logAction, logCustomActionName,
        logUnit, logNumberOfLogUnits,
        logLastModified, logIsDeleted,
        )
        VALUES (
          ?, ?, 
          ?, ?, ?, ?,
          CURRENT_TIMESTAMP(), 0,
          )`,
    [
      log.dogId, log.userId,
      log.logDate, log.logNote, log.logAction, log.logCustomActionName,
      log.logUnit, log.logNumberOfLogUnits,
      // none, default values
    ],
  );

  return result.insertId;
}

export { createLogForUserIdDogId };
