import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

/**
 *  Queries the database to delete a log. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteLogForLogUUID(databaseConnection: Queryable, logUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE logUUID = ? AND logIsDeleted = 0`,
    [logUUID],
  );
}

/**
 *  Queries the database to delete all logs for a dogUUID. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllLogsForDogUUID(databaseConnection: Queryable, dogUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogLogs
    SET logIsDeleted = 1, logLastModified = CURRENT_TIMESTAMP()
    WHERE dogUUID = ? AND logIsDeleted = 0`,
    [dogUUID],
  );
}

export { deleteLogForLogUUID, deleteAllLogsForDogUUID };
