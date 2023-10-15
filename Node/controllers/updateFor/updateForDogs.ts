import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';
import { DogsRow } from '../../main/types/DogsRow';

/**
 *  Queries the database to update a dog. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateDogForDogId(databaseConnection: Queryable, dog: Partial<DogsRow>): Promise<void> {
  const {
    dogName, dogId,
  } = dog;

  if (dogName === undefined) {
    throw new HoundError('dogName missing', 'updateDogForDogId', ERROR_CODES.VALUE.MISSING);
  }
  if (dogId === undefined) {
    throw new HoundError('dogId missing', 'updateDogForDogId', ERROR_CODES.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogName = ?, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogId = ?`,
    [dogName, dogId],
  );
}

export { updateDogForDogId };
