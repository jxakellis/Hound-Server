import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { DogLogsRow, prefixDogLogsColumns } from '../../main/types/DogLogsRow';

/**
 *  If the query is successful, returns the log for the dogId.
 *  If a problem is encountered, creates and throws custom error
*/
async function getLogForLogId(databaseConnection: Queryable, logId: number, userConfigurationPreviousDogManagerSynchronization?: Date): Promise<DogLogsRow | undefined> {
  const result = userConfigurationPreviousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${prefixDogLogsColumns}
      FROM dogLogs dl
      WHERE TIMESTAMPDIFF(MICROSECOND, logLastModified, ?) <= 0 AND logId = ?
      LIMIT 1`,
      [userConfigurationPreviousDogManagerSynchronization, logId],
    )
    : await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${prefixDogLogsColumns}
      FROM dogLogs dl
      WHERE logId = ?
      LIMIT 1`,
      [logId],
    );

  return result.safeIndex(0);
}

/**
 *  If the query is successful, returns an array of all the logs for the dogId. Errors not handled
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllLogsForDogId(databaseConnection: Queryable, dogId: number, userConfigurationPreviousDogManagerSynchronization?: Date): Promise<DogLogsRow[]> {
  const result = userConfigurationPreviousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${prefixDogLogsColumns}
      FROM dogLogs dl
      WHERE TIMESTAMPDIFF(MICROSECOND, logLastModified, ?) <= 0 AND dogId = ?
      LIMIT 18446744073709551615`,
      [userConfigurationPreviousDogManagerSynchronization, dogId],
    )
    : await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${prefixDogLogsColumns}
      FROM dogLogs dl
      WHERE dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    );

  return result;
}

export { getLogForLogId, getAllLogsForDogId };
