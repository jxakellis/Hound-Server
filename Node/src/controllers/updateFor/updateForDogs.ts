import { type Queryable, databaseQuery } from '../../main/database/databaseQuery';

/**
 *  Queries the database to update a dog. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateDogForDogId(databaseConnection: Queryable, dogId: number, dogName: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogName = ?, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogId = ?`,
    [dogName, dogId],
  );
}

export { updateDogForDogId };
