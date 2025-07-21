import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetUpdatedDogLogsRow } from '../../main/types/rows/DogLogsRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';
import { getLogActionTypeForId } from '../get/types/getLogActionType.js';
import type { LogUnitTypeRow } from '../../main/types/rows/LogUnitTypeRow.js';
import { getLogUnitTypeForId } from '../get/types/getLogUnitType.js';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForLog(databaseConnection: Queryable, log: NotYetUpdatedDogLogsRow): Promise<void> {
  // TODO FUTURE DEPRECIATE this logAction is compatibility for <= 3.5.0
  const logAction = await getLogActionTypeForId(databaseConnection, log.logActionTypeId);
  let logUnit: LogUnitTypeRow | undefined;
  if (log.logUnitTypeId !== undefined) {
    logUnit = await getLogUnitTypeForId(databaseConnection, log.logUnitTypeId);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET 
    logStartDate = ?, logEndDate = ?,
    DEPRECIATED_logAction = ?,
    logActionTypeId = ?, logCustomActionName = ?,
    DEPRECIATED_logUnit = ?,
    logNote = ?, logUnitTypeId = ?, logNumberOfLogUnits = ?,
    logLastModified = CURRENT_TIMESTAMP()
    WHERE logUUID = ?`,
    [
      log.logStartDate, log.logEndDate,
      logAction?.internalValue,
      log.logActionTypeId, formatKnownString(log.logCustomActionName, 32),
      logUnit?.readableValue,
      formatKnownString(log.logNote, 500), log.logUnitTypeId, log.logNumberOfLogUnits,
      // logCreatedByReminderUUID can't be updated once the reminder is created
      // none, default values
      log.logUUID,
    ],
  );
}

export { updateLogForLog };
