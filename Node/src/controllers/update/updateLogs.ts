import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetUpdatedDogLogsRow } from '../../main/types/rows/DogLogsRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';
import { getLogActionTypeForId } from '../get/types/getLogActionType.js';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForLog(databaseConnection: Queryable, log: NotYetUpdatedDogLogsRow): Promise<void> {
  // TODO FUTURE DEPRECIATE this logAction is compatibility for <= 3.5.0
  const logAction = await getLogActionTypeForId(databaseConnection, log.logActionTypeId);

  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET 
    logStartDate = ?, logEndDate = ?,
    DEPRECIATED_logAction = ?,
    logActionTypeId = ?, logCustomActionName = ?,
    logNote = ?, logUnit = ?, logNumberOfLogUnits = ?,
    logLastModified = CURRENT_TIMESTAMP()
    WHERE logUUID = ?`,
    [
      log.logStartDate, log.logEndDate,
      logAction?.internalValue,
      log.logActionTypeId, formatKnownString(log.logCustomActionName, 32),
      formatKnownString(log.logNote, 500), log.logUnit, log.logNumberOfLogUnits,
      // none, default values
      log.logUUID,
    ],
  );
}

export { updateLogForLog };
