import { Queryable, ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery';
import { LIMIT } from '../../main/server/globalConstants';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';
import { DogsRow, dogsColumns } from '../../main/types/DogsRow';

/**
 *  Queries the database to create a dog. If the query is successful, then returns the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createDogForFamilyId(databaseConnection: Queryable, familyId: string, dogName: string): Promise<number> {
  const dogs = await databaseQuery<DogsRow[]>(
    databaseConnection,
    `SELECT ${dogsColumns}
    FROM dogs d
    WHERE dogIsDeleted = 0 AND familyId = ?
    LIMIT 18446744073709551615`,
    [familyId],
  );

  // Creating a new dog would exceed the limit
  if (dogs.length >= LIMIT.NUMBER_OF_DOGS_PER_FAMILY) {
    throw new HoundError(`Dog limit of ${LIMIT.NUMBER_OF_DOGS_PER_FAMILY} exceeded`, 'createDogForFamilyId', ERROR_CODES.FAMILY.LIMIT.DOG_TOO_LOW);
  }

  // TODO NOW for all INSERT INTO statements, separate the statement into different lines.
  // Then if a static value is provided in a string for a column, (e.g. CURRENT_TIMESTAMP for some date), add comments in the variable array to indicate the absense of values
  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogs
    (familyId, dogName, dogLastModified)
    VALUES (?, ?, CURRENT_TIMESTAMP())`,
    [familyId, dogName],
  );

  return result.insertId;
}

export { createDogForFamilyId };
