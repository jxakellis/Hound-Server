const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatString } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

/**
 *  Queries the database to update a dog. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateDogForDogId(databaseConnection, dogId, forDogName) {
  const dogLastModified = new Date();
  const dogName = formatString(forDogName, 32);

  // if dogName undefined, then there is nothing to update
  if (areAllDefined(databaseConnection, dogId, dogName) === false) {
    throw new ValidationError('databaseConnection, dogId, or dogName missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // updates the dogName for the dogId provided
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogName = ?, dogLastModified = ?
    WHERE dogId = ?`,
    [dogName, dogLastModified, dogId],
  );
}

module.exports = { updateDogForDogId };
