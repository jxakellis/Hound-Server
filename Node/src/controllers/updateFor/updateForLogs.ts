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
    SET 
    logStartDate = ?, logEndDate = ?,
    logAction = ?, logCustomActionName = ?,
    logNote = ?, logUnit = ?, logNumberOfLogUnits = ?,
    logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ?`,
    [
      log.logStartDate, log.logEndDate,
      log.logAction, log.logCustomActionName,
      log.logNote, log.logUnit, log.logNumberOfLogUnits,
      // none, default values
      log.logId,
    ],
  );
}

export { updateLogForDogIdLogId };
