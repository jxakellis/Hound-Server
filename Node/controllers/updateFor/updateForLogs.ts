import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';
import { DogLogsRow } from '../../main/types/DogLogsRow';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForDogIdLogId(databaseConnection: Queryable, dogId: number, log: Partial<DogLogsRow>): Promise<void> {
  const {
    logDate, logAction, logCustomActionName, logNote, logId,
  } = log;

  if (logDate === undefined) {
    throw new HoundError('logDate missing', 'updateLogForDogIdLogId', ERROR_CODES.VALUE.MISSING);
  }
  if (logAction === undefined) {
    throw new HoundError('logAction missing', 'updateLogForDogIdLogId', ERROR_CODES.VALUE.MISSING);
  }
  if (logCustomActionName === undefined) {
    throw new HoundError('logCustomActionName missing', 'updateLogForDogIdLogId', ERROR_CODES.VALUE.MISSING);
  }
  if (logNote === undefined) {
    throw new HoundError('logNote missing', 'updateLogForDogIdLogId', ERROR_CODES.VALUE.MISSING);
  }
  if (logId === undefined) {
    throw new HoundError('logId missing', 'updateLogForDogIdLogId', ERROR_CODES.VALUE.MISSING);
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
