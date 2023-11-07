import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

/**
 *  Queries the database to delete a log. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteLogForLogId(databaseConnection: Queryable, logId: number): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE logId = ? AND logIsDeleted = 0`,
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
    WHERE dogId = ? AND logIsDeleted = 0`,
    [dogId],
  );
}

export { deleteLogForLogId, deleteAllLogsForDogId };
