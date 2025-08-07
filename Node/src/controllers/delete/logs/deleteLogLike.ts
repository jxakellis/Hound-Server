import type { DogLogLikeRow } from '../../../main/types/rows/DogLogLikeRow.js';
import { databaseQuery, type Queryable } from '../../../main/database/databaseQuery.js';

async function deleteSingleLogLike(databaseConnection: Queryable, logUUID: string, userId: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    'DELETE FROM dogLogLike WHERE logUUID = ? AND userId = ?',
    [logUUID, userId],
  );
}

async function deleteMultipleLogLikes(databaseConnection: Queryable, likes: DogLogLikeRow[]): Promise<void> {
  const promises = likes.map((like) => deleteSingleLogLike(databaseConnection, like.logUUID, like.userId));
  await Promise.all(promises);
}

export { deleteSingleLogLike, deleteMultipleLogLikes };
