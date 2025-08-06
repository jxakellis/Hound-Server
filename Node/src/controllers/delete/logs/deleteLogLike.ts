import { databaseQuery, type Queryable } from '../../../main/database/databaseQuery.js';

async function deleteSpecificLogLike(databaseConnection: Queryable, logUUID: string, userId: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    'DELETE FROM dogLogLike WHERE logUUID = ? AND userId = ?',
    [logUUID, userId],
  );
}

async function deleteAllLogLikes(databaseConnection: Queryable, logUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    'DELETE FROM dogLogLike WHERE logUUID = ?',
    [logUUID],
  );
}

export { deleteSpecificLogLike, deleteAllLogLikes };
