import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { DogsRow, prefixDogsColumns } from '../../main/types/DogsRow';

import { deleteAllLogsForDogId } from './deleteForLogs';
import { deleteAllRemindersForFamilyIdDogId } from './deleteForReminders';

/**
 *  Queries the database to delete a dog and everything nested under it. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteDogForFamilyIdDogId(databaseConnection: Queryable, familyId: string, dogId: number): Promise<void> {
  await deleteAllRemindersForFamilyIdDogId(databaseConnection, familyId, dogId);
  await deleteAllLogsForDogId(databaseConnection, dogId);
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogIsDeleted = 1, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogId = ?`,
    [dogId],
  );
}

/**
 * Queries the database to delete all dog and everything nested under them. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllDogsForFamilyId(databaseConnection: Queryable, familyId: string): Promise<void> {
  const dogs = await databaseQuery<DogsRow[]>(
    databaseConnection,
    `SELECT ${prefixDogsColumns}
    FROM dogs d
    WHERE dogIsDeleted = 0 AND familyId = ?
    LIMIT 18446744073709551615`,
    [familyId],
  );

  // delete all the dogs
  const promises = [];
  for (let i = 0; i < dogs.length; i += 1) {
    promises.push(deleteDogForFamilyIdDogId(databaseConnection, familyId, dogs[i].dogId));
  }

  await Promise.all(promises);
}

export { deleteDogForFamilyIdDogId, deleteAllDogsForFamilyId };
