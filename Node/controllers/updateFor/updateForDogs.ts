const { databaseQuery } from '../../main/database/databaseQuery';
const { formatUnknownString } from '../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/server/globalErrors';

/**
 *  Queries the database to update a dog. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateDogForDogId(databaseConnection, dogId, forDogName) {
  const dogName = formatUnknownString(forDogName, 32);

  // if dogName null, then there is nothing to update
  if (areAllDefined(databaseConnection, dogId, dogName) === false) {
    throw new ValidationError('databaseConnection, dogId, or dogName missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // updates the dogName for the dogId provided
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogName = ?, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogId = ?`,
    [dogName, dogId],
  );
}

export { updateDogForDogId };
