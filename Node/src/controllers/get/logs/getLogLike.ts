import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type DogLogLikeRow, dogLogLikeColumns } from '../../../main/types/rows/DogLogLikeRow.js';

async function getLogLikesForLogUUID(databaseConnection: Queryable, logUUID: string): Promise<DogLogLikeRow[]> {
  return databaseQuery<DogLogLikeRow[]>(
    databaseConnection,
    `SELECT ${dogLogLikeColumns}
       FROM dogLogLike dll
      WHERE dll.logUUID = ?
      LIMIT 18446744073709551615`,
    [logUUID],
  );
}

async function getLogLikesForLogUUIDs(databaseConnection: Queryable, logUUIDs: string[]): Promise<DogLogLikeRow[]> {
  return databaseQuery<DogLogLikeRow[]>(
    databaseConnection,
    `SELECT ${dogLogLikeColumns}
       FROM dogLogLike dll
      WHERE dll.logUUID IN (?)
      LIMIT 18446744073709551615`,
    [logUUIDs],
  );
}

export { getLogLikesForLogUUID, getLogLikesForLogUUIDs };
