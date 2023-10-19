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
    
    ,
  );

  // Creating a new dog would exceed the limit
  if (dogs.length >= LIMIT.NUMBER_OF_DOGS_PER_FAMILY) {
    throw new HoundError(`Dog limit of ${LIMIT.NUMBER_OF_DOGS_PER_FAMILY} exceeded`, createDogForFamilyId, ERROR_CODES.FAMILY.LIMIT.DOG_TOO_LOW);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogs
      (
        familyId,
        dogName,
        dogLastModified
        )
        VALUES (
          ?,
          ?,
          CURRENT_TIMESTAMP()
          )`,
    [
      familyId,
      dogName,
      // none, default value
    ],
  );

  return result.insertId;
}

export { createDogForFamilyId };
