import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type DogLogsRow, dogLogsColumns } from '../../../main/types/rows/DogLogsRow.js';
import { getLogLikesForLogUUID, getLogLikesForLogUUIDs } from './getLogLike.js';

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 */
async function getLogForLogUUID(
  databaseConnection: Queryable,
  logUUID: string,
  includeDeletedLogs: boolean,
): Promise<DogLogsRow | undefined> {
  let logs = await databaseQuery<DogLogsRow[]>(
    databaseConnection,
    `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE logUUID = ?
      LIMIT 1`,
    [logUUID],
  );

  if (includeDeletedLogs === false) {
    logs = logs.filter((possiblyDeletedLog) => possiblyDeletedLog.logIsDeleted === 0);
  }

  const log = logs.safeIndex(0);
  if (log === undefined) {
    return undefined;
  }
  const likes = await getLogLikesForLogUUID(databaseConnection, log.logUUID);
  log.logLikedByUserIds = likes.map((l) => l.userId);

  return log;
}

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllLogsForDogUUID(databaseConnection: Queryable, dogUUID: string, includeDeletedLogs: boolean, previousDogManagerSynchronization?: Date): Promise<DogLogsRow[]> {
  let logs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE dogUUID = ? AND TIMESTAMPDIFF(MICROSECOND, COALESCE(logLastModified, logCreated), ?) <= 0
      LIMIT 18446744073709551615`,
      [dogUUID, previousDogManagerSynchronization],
    )
    : await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE dogUUID = ?
      LIMIT 18446744073709551615`,
      [dogUUID],
    );

  if (includeDeletedLogs === false) {
    logs = logs.filter((possiblyDeletedLog) => possiblyDeletedLog.logIsDeleted === 0);
  }

  const logUUIDs = logs.map((l) => l.logUUID);
  if (logUUIDs.length > 0) {
    const likeRows = await getLogLikesForLogUUIDs(databaseConnection, logUUIDs);
    logs.forEach((log, index) => {
      logs[index].logLikedByUserIds = likeRows
        .filter((l) => l.logUUID === log.logUUID)
        .map((l) => l.userId);
    });
  }

  return logs;
}

export { getLogForLogUUID, getAllLogsForDogUUID };
