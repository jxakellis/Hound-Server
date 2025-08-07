import type { NotYetCreatedDogLogLikeRow } from '../../../main/types/rows/DogLogLikeRow.js';
import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';

async function createSingleLogLike(
  databaseConnection: Queryable,
  like: NotYetCreatedDogLogLikeRow,
): Promise<void> {
  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogLogLike(logUUID, userId, likeCreated) VALUES (?, ?, CURRENT_TIMESTAMP())',
    [like.logUUID, like.userId],
  );
}

async function createMultipleLogLikes(
  databaseConnection: Queryable,
  likes: NotYetCreatedDogLogLikeRow[],
): Promise<void> {
  const promises = likes.map((l) => createSingleLogLike(databaseConnection, l));
  await Promise.all(promises);
}

export { createSingleLogLike, createMultipleLogLikes };
