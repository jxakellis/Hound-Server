import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type DogLogsRow, dogLogsColumns } from '../../main/types/DogLogsRow.js';

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 */
async function getLogForLogIdUUID(
  databaseConnection: Queryable,
  includeDeletedLogs: boolean,
  logId?: number,
  logUUID?: string,
): Promise<DogLogsRow | undefined> {
  let logs: DogLogsRow[] = [];

  if (logUUID !== undefined && logUUID !== null) {
    logs = await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
        FROM dogLogs dl
        WHERE logUUID = ?
        LIMIT 1`,
      [logUUID],
    );
  }
  else if (logId !== undefined && logId !== null) {
    logs = await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
        FROM dogLogs dl
        WHERE logId = ?
        LIMIT 1`,
      [logId],
    );
  }

  if (includeDeletedLogs === false) {
    logs = logs.filter((possiblyDeletedLog) => possiblyDeletedLog.logIsDeleted === 0);
  }

  return logs.safeIndex(0);
}

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllLogsForDogId(databaseConnection: Queryable, dogId: number, includeDeletedLogs: boolean, previousDogManagerSynchronization?: Date): Promise<DogLogsRow[]> {
  let logs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE dogId = ? AND TIMESTAMPDIFF(MICROSECOND, logLastModified, ?) <= 0
      LIMIT 18446744073709551615`,
      [dogId, previousDogManagerSynchronization],
    )
    : await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
      FROM dogLogs dl
      WHERE dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    );

  if (includeDeletedLogs === false) {
    logs = logs.filter((possiblyDeletedLog) => possiblyDeletedLog.logIsDeleted === 0);
  }

  return logs;
}

export { getLogForLogIdUUID, getAllLogsForDogId };
