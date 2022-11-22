const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { formatString } = require('../../main/tools/format/formatObject');

/**
 *  Queries the database to create a dog. If the query is successful, then returns the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createDogForFamilyId(databaseConnection, familyId, familyActiveSubscription, forDogName) {
  const dogLastModified = new Date();
  const dogName = formatString(forDogName, 32);

  if (areAllDefined(databaseConnection, familyId, familyActiveSubscription, familyActiveSubscription.numberOfDogs, dogName) === false) {
    throw new ValidationError('databaseConnection, familyId, familyActiveSubscription, or dogName missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // only retrieve enough not deleted dogs that would exceed the limit
  const dogs = await databaseQuery(
    databaseConnection,
    'SELECT 1 FROM dogs WHERE dogIsDeleted = 0 AND familyId = ? LIMIT ?',
    [familyId, familyActiveSubscription.numberOfDogs],
  );

  if (areAllDefined(familyActiveSubscription, dogs) === false) {
    throw new ValidationError('familyActiveSubscription or dogs missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Creating a new dog would exceed the limit
  if (dogs.length >= familyActiveSubscription.numberOfDogs) {
    throw new ValidationError(`Dog limit of ${familyActiveSubscription.numberOfDogs} exceeded`, global.CONSTANT.ERROR.FAMILY.LIMIT.DOG_TOO_LOW);
  }

  const result = await databaseQuery(
    databaseConnection,
    'INSERT INTO dogs(familyId, dogName, dogLastModified) VALUES (?,?,?)',
    [familyId, dogName, dogLastModified],
  );
  return result.insertId;
}

module.exports = { createDogForFamilyId };
