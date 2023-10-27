import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { getAllDogsForFamilyId } from '../getFor/getForDogs.js';

import { deleteAllLogsForDogId } from './deleteForLogs.js';
import { deleteAllRemindersForFamilyIdDogId } from './deleteForReminders.js';

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
  const notDeletedDogs = await getAllDogsForFamilyId(databaseConnection, familyId, false);

  // delete all the dogs
  const promises: Promise<void>[] = [];
  notDeletedDogs.forEach((notDeletedDog) => promises.push(deleteDogForFamilyIdDogId(databaseConnection, familyId, notDeletedDog.dogId)));

  await Promise.all(promises);
}

export { deleteDogForFamilyIdDogId, deleteAllDogsForFamilyId };
