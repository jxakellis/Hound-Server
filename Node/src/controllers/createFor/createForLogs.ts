import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { LIMIT } from '../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { type NotYetCreatedDogLogsRow } from '../../main/types/DogLogsRow.js';
import { getAllLogsForDogId } from '../getFor/getForLogs.js';

/**
*  Queries the database to create a log. If the query is successful, then returns the logId.
*  If a problem is encountered, creates and throws custom error
*/
async function createLogForUserIdDogId(databaseConnection: Queryable, log: NotYetCreatedDogLogsRow): Promise<number> {
  const notDeletedLogs = await getAllLogsForDogId(databaseConnection, log.dogId, false, undefined);

  // make sure that the user isn't creating too many logs
  if (notDeletedLogs.length >= LIMIT.NUMBER_OF_LOGS_PER_DOG) {
    throw new HoundError(`Dog log limit of ${LIMIT.NUMBER_OF_LOGS_PER_DOG} exceeded`, createLogForUserIdDogId, ERROR_CODES.FAMILY.LIMIT.LOG_TOO_LOW);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogLogs
      (
        dogId, userId,
        logStartDate, logEndDate, logNote, logAction, logCustomActionName,
        logUnit, logNumberOfLogUnits,
        logLastModified, logIsDeleted,
        )
        VALUES (
          ?, ?, 
          ?, ?, ?, ?, ?,
          ?, ?,
          CURRENT_TIMESTAMP(), 0,
          )`,
    [
      log.dogId, log.userId,
      log.logStartDate, log.logEndDate, log.logNote, log.logAction, log.logCustomActionName,
      log.logUnit, log.logNumberOfLogUnits,
      // none, default values
    ],
  );

  return result.insertId;
}

export { createLogForUserIdDogId };
