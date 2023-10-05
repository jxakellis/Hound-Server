const { databaseQuery } from '../../main/database/databaseQuery';
const { formatString } from '../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/server/globalErrors';

/**
 *  Queries the database to create a dog. If the query is successful, then returns the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createDogForFamilyId(databaseConnection, familyId, forDogName) {
  const dogName = formatString(forDogName, 32);

  if (areAllDefined(databaseConnection, familyId, dogName) === false) {
    throw new ValidationError('databaseConnection, familyId, or dogName missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // only retrieve enough not deleted dogs that would exceed the limit
  const dogs = await databaseQuery(
    databaseConnection,
    `SELECT 1
    FROM dogs d
    WHERE dogIsDeleted = 0 AND familyId = ?
    LIMIT 18446744073709551615`,
    [familyId],
  );

  if (areAllDefined(dogs) === false) {
    throw new ValidationError('dogs missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Creating a new dog would exceed the limit
  if (dogs.length >= global.CONSTANT.LIMIT.NUMBER_OF_DOGS_PER_FAMILY) {
    throw new ValidationError(`Dog limit of ${global.CONSTANT.LIMIT.NUMBER_OF_DOGS_PER_FAMILY} exceeded`, global.CONSTANT.ERROR.FAMILY.LIMIT.DOG_TOO_LOW);
  }

  const result = await databaseQuery(
    databaseConnection,
    `INSERT INTO dogs
    (familyId, dogName, dogLastModified)
    VALUES (?, ?, CURRENT_TIMESTAMP())`,
    [familyId, dogName],
  );
  return result.insertId;
}

export { createDogForFamilyId };
