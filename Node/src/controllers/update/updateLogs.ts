import { ERROR_CODES, HoundError } from 'src/main/server/globalErrors.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetUpdatedDogLogsRow } from '../../main/types/rows/DogLogsRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';
import { getLogForLogUUID } from '../get/logs/getLogs.js';
import { createMultipleLogLikes } from '../create/logs/createLogLike.js';
import { deleteMultipleLogLikes } from '../delete/logs/deleteLogLike.js';

/**
 *  Queries the database to update a log. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateLogForLog(databaseConnection: Queryable, log: NotYetUpdatedDogLogsRow): Promise<void> {
  const userId = log.logLastModifiedBy;
  const existingLog = await getLogForLogUUID(databaseConnection, log.logUUID, false);

  if (existingLog === undefined) {
    throw new HoundError('No log found or invalid permissions', updateLogForLog, ERROR_CODES.VALUE.MISSING);
  }
  if (userId === undefined) {
    throw new HoundError('No user found or invalid permissions', updateLogForLog, ERROR_CODES.VALUE.MISSING);
  }

  const oldLikeUserIds = existingLog.logLikedByUserIds;
  const newLikeUserIds = log.logLikedByUserIds;

  const addedLikeUserIds = newLikeUserIds.filter((id) => !oldLikeUserIds.includes(id));
  const removedLikeUserIds = oldLikeUserIds.filter((id) => !newLikeUserIds.includes(id));

  // If any likes are added or removed, ensure only the current user is modifying their own like
  if ((addedLikeUserIds.length > 0 || removedLikeUserIds.length > 0)
      && (addedLikeUserIds.some((id) => id !== userId) || removedLikeUserIds.some((id) => id !== userId))
  ) {
    throw new HoundError(
      'Attempted to modify log likes for users other than yourself',
      updateLogForLog,
      ERROR_CODES.PERMISSION.NO.LOG,
    );
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET 
    logStartDate = ?, logEndDate = ?,
    logActionTypeId = ?, logCustomActionName = ?,
    logNote = ?, logUnitTypeId = ?, logNumberOfLogUnits = ?,
    logLastModified = CURRENT_TIMESTAMP(),
    logLastModifiedBy = ?
    WHERE logUUID = ?`,
    [
      log.logStartDate, log.logEndDate,
      log.logActionTypeId, formatKnownString(log.logCustomActionName, 32),
      formatKnownString(log.logNote, 500), log.logUnitTypeId, log.logNumberOfLogUnits,
      // logCreatedByReminderUUID can't be updated once the reminder is created
      // none, default values
      log.logLastModifiedBy,
      log.logUUID,
    ],
  );

  if (addedLikeUserIds.length > 0) {
    await createMultipleLogLikes(
      databaseConnection,
      addedLikeUserIds.map((addedLikeUserId) => ({
        logUUID: log.logUUID,
        userId: addedLikeUserId,
      })),
    );
  }

  if (removedLikeUserIds.length > 0) {
    await deleteMultipleLogLikes(
      databaseConnection,
      removedLikeUserIds.map((removedLikeUserId) => ({
        logUUID: log.logUUID,
        userId: removedLikeUserId,
      })),
    );
  }
}

export { updateLogForLog };
