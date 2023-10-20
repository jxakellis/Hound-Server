import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetUpdatedDogLogsRow } from '../../main/types/DogLogsRow.js';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForDogIdLogId(databaseConnection: Queryable, log: NotYetUpdatedDogLogsRow): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logDate = ?, logAction = ?, logCustomActionName = ?, logNote = ?, logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ?`,
    [log.logDate, log.logAction, log.logCustomActionName, log.logNote, log.logId],
  );
}

export { updateLogForDogIdLogId };
