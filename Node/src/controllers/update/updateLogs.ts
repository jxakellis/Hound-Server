import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetUpdatedDogLogsRow } from '../../main/types/DogLogsRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForLog(databaseConnection: Queryable, log: NotYetUpdatedDogLogsRow): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET 
    logStartDate = ?, logEndDate = ?,
    logAction = ?, logCustomActionName = ?,
    logNote = ?, logUnit = ?, logNumberOfLogUnits = ?,
    logLastModified = CURRENT_TIMESTAMP()
    WHERE logUUID = ?`,
    [
      log.logStartDate, log.logEndDate,
      log.logAction, formatKnownString(log.logCustomActionName, 32),
      formatKnownString(log.logNote, 500), log.logUnit, log.logNumberOfLogUnits,
      // none, default values
      log.logUUID,
    ],
  );
}

export { updateLogForLog };
