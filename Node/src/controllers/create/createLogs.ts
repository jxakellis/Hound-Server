import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { LIMIT } from '../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { type NotYetCreatedDogLogsRow } from '../../main/types/rows/DogLogsRow.js';
import { getAllLogsForDogUUID } from '../get/getLogs.js';
import { formatKnownString, formatUnknownString } from '../../main/format/formatObject.js';
import { getLogActionTypeForId } from '../get/types/getLogActionType.js';
import { getLogUnitTypeForId } from '../get/types/getLogUnitType.js';
import type { LogUnitTypeRow } from '../../main/types/rows/LogUnitTypeRow.js';

/**
*  Queries the database to create a log. If the query is successful, then returns the logId.
*  If a problem is encountered, creates and throws custom error
*/
async function createLogForLog(databaseConnection: Queryable, log: NotYetCreatedDogLogsRow): Promise<number> {
  const notDeletedLogs = await getAllLogsForDogUUID(databaseConnection, log.dogUUID, false, undefined);

  // make sure that the user isn't creating too many logs
  if (notDeletedLogs.length >= LIMIT.NUMBER_OF_LOGS_PER_DOG) {
    throw new HoundError(`Dog log limit of ${LIMIT.NUMBER_OF_LOGS_PER_DOG} exceeded`, createLogForLog, ERROR_CODES.FAMILY.LIMIT.LOG_TOO_LOW);
  }

  // TODO FUTURE DEPRECIATE this logAction is compatibility for <= 4.0.0
  const logAction = await getLogActionTypeForId(databaseConnection, log.logActionTypeId);
  let logUnit: LogUnitTypeRow | undefined;
  if (log.logUnitTypeId !== undefined) {
    logUnit = await getLogUnitTypeForId(databaseConnection, log.logUnitTypeId);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogLogs
      (
        logUUID,
        dogUUID, userId,
        DEPRECIATED_logAction,
        logStartDate, logEndDate, logNote, logActionTypeId, logCustomActionName,
        DEPRECIATED_logUnit,
        logUnitTypeId, logNumberOfLogUnits,
        logCreatedByReminderUUID,
        logLastModified, logIsDeleted,
        )
        VALUES (
          ?,
          ?, ?, 
          ?,
          ?, ?, ?, ?, ?,
          ?,
          ?, ?,
          ?,
          CURRENT_TIMESTAMP(), 0,
          )`,
    [
      formatKnownString(log.logUUID, 36),
      log.dogUUID, log.userId,
      logAction?.internalValue,
      log.logStartDate, log.logEndDate, formatKnownString(log.logNote, 500), log.logActionTypeId, formatKnownString(log.logCustomActionName, 32),
      logUnit?.readableValue,
      log.logUnitTypeId, log.logNumberOfLogUnits,
      formatUnknownString(log.logCreatedByReminderUUID, 36),
      // none, default values
    ],
  );

  return result.insertId;
}

export { createLogForLog };
