import { Queryable, databaseQuery } from '../../main/database/databaseQuery';

/**
 *  Queries the database to delete a log. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteLogForLogId(databaseConnection: Queryable, dogId: number, logId: number): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ?`,
    [logId],
  );
}

/**
 *  Queries the database to delete all logs for a dogId. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllLogsForDogId(databaseConnection: Queryable, dogId: number): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE logIsDeleted = 0 AND dogId = ?`,
    [dogId],
  );
}

export { deleteLogForLogId, deleteAllLogsForDogId };
