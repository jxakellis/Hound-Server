import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type DogLogsRow, dogLogsColumns } from '../../main/types/rows/DogLogsRow.js';

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 */
async function getLogForLogUUID(
  databaseConnection: Queryable,
  logUUID: string,
  includeDeletedLogs: boolean,
): Promise<DogLogsRow | undefined> {
  // TODO FUTURE DEPRECIATE this logAction & logUnit  is compatibility for <= 3.5.0
  let logs = await databaseQuery<DogLogsRow[]>(
    databaseConnection,
    `SELECT ${dogLogsColumns}, lat.internalValue AS logAction, lut.readableValue as logUnit
      FROM dogLogs dl
      LEFT JOIN logActionType lat ON dl.logActionTypeId = lat.logActionTypeId
      LEFT JOIN logUnitType lut ON dl.logUnitTypeId = lut.logUnitTypeId
      WHERE logUUID = ?
      LIMIT 1`,
    [logUUID],
  );

  if (includeDeletedLogs === false) {
    logs = logs.filter((possiblyDeletedLog) => possiblyDeletedLog.logIsDeleted === 0);
  }

  return logs.safeIndex(0);
}

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllLogsForDogUUID(databaseConnection: Queryable, dogUUID: string, includeDeletedLogs: boolean, previousDogManagerSynchronization?: Date): Promise<DogLogsRow[]> {
  // TODO FUTURE DEPRECIATE this logAction & logUnit  is compatibility for <= 3.5.0
  let logs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}, lat.internalValue AS logAction, lut.readableValue as logUnit
      FROM dogLogs dl
      LEFT JOIN logActionType lat ON dl.logActionTypeId = lat.logActionTypeId
      LEFT JOIN logUnitType lut ON dl.logUnitTypeId = lut.logUnitTypeId
      WHERE dogUUID = ? AND TIMESTAMPDIFF(MICROSECOND, logLastModified, ?) <= 0
      LIMIT 18446744073709551615`,
      [dogUUID, previousDogManagerSynchronization],
    )
    : await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}, lat.internalValue AS logAction, lut.readableValue as logUnit
      FROM dogLogs dl
      LEFT JOIN logActionType lat ON dl.logActionTypeId = lat.logActionTypeId
      LEFT JOIN logUnitType lut ON dl.logUnitTypeId = lut.logUnitTypeId
      WHERE dogUUID = ?
      LIMIT 18446744073709551615`,
      [dogUUID],
    );

  if (includeDeletedLogs === false) {
    logs = logs.filter((possiblyDeletedLog) => possiblyDeletedLog.logIsDeleted === 0);
  }

  return logs;
}

export { getLogForLogUUID, getAllLogsForDogUUID };
