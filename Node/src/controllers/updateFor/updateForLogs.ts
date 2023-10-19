import { type Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { type DogLogsRow } from '../../main/types/DogLogsRow';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForDogIdLogId(databaseConnection: Queryable, log: DogLogsRow): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logDate = ?, logAction = ?, logCustomActionName = ?, logNote = ?, logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ?`,
    [log.logDate, log.logAction, log.logCustomActionName, log.logNote, log.logId],
  );
}

export { updateLogForDogIdLogId };
