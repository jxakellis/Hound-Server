const { databaseQuery } from '../../main/tools/database/databaseQuery';
const { ValidationError } from '../../main/tools/general/errors';
const { areAllDefined } from '../../main/tools/validate/validateDefined';

const { deleteAllLogsForDogId } from './deleteForLogs';
const { deleteAllRemindersForFamilyIdDogId } from './deleteForReminders';

/**
 *  Queries the database to delete a dog and everything nested under it. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteDogForFamilyIdDogId(databaseConnection, familyId, dogId) {
  if (areAllDefined(databaseConnection, familyId, dogId) === false) {
    throw new ValidationError('databaseConnection, familyId, or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [
    // delete all reminders
    deleteAllRemindersForFamilyIdDogId(databaseConnection, familyId, dogId),
    // deletes all logs
    deleteAllLogsForDogId(databaseConnection, dogId),
    // deletes dog
    databaseQuery(
      databaseConnection,
      `UPDATE dogs
      SET dogIsDeleted = 1, dogLastModified = CURRENT_TIMESTAMP()
      WHERE dogId = ?`,
      [dogId],
    ),
  ];

  await Promise.all(promises);
}

/**
 * Queries the database to delete all dog and everything nested under them. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllDogsForFamilyId(databaseConnection, familyId) {
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // attempt to find all dogIds
  const dogIds = await databaseQuery(
    databaseConnection,
    `SELECT dogId
    FROM dogs d
    WHERE dogIsDeleted = 0 AND familyId = ?
    LIMIT 18446744073709551615`,
    [familyId],
  );

  // delete all the dogs
  const promises = [];
  for (let i = 0; i < dogIds.length; i += 1) {
    promises.push(deleteDogForFamilyIdDogId(databaseConnection, familyId, dogIds[i].dogId));
  }

  await Promise.all(promises);
}

export { deleteDogForFamilyIdDogId, deleteAllDogsForFamilyId };
