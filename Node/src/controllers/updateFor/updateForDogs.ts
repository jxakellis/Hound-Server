import type { NotYetUpdatedDogsRow } from 'src/main/types/DogsRow.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

/**
 *  Queries the database to update a dog. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateDogForDogId(databaseConnection: Queryable, dog: NotYetUpdatedDogsRow): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogName = ?, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogId = ?`,
    [dog.dogName, dog.dogId],
  );
}

export { updateDogForDogId };
