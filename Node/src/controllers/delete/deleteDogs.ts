import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { getAllDogsForFamilyId } from '../get/getDogs.js';

import { deleteAllLogsForDogUUID } from './deleteLogs.js';
import { deleteAllRemindersForFamilyIdDogUUID } from './reminders/deleteReminders.js';
import { deleteAllTriggersForDogUUID } from './deleteTriggers.js';

/**
 *  Queries the database to delete a dog and everything nested under it. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteDogForFamilyIdDogUUID(databaseConnection: Queryable, familyId: string, dogUUID: string): Promise<void> {
  await deleteAllRemindersForFamilyIdDogUUID(databaseConnection, familyId, dogUUID);
  await deleteAllLogsForDogUUID(databaseConnection, dogUUID);
  await deleteAllTriggersForDogUUID(databaseConnection, dogUUID);
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogIsDeleted = 1, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogUUID = ?`,
    [dogUUID],
  );
}

/**
 * Queries the database to delete all dog and everything nested under them. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllDogsForFamilyId(databaseConnection: Queryable, familyId: string): Promise<void> {
  const notDeletedDogs = await getAllDogsForFamilyId(databaseConnection, familyId, false, false, undefined);

  // delete all the dogs
  const promises: Promise<void>[] = [];
  notDeletedDogs.forEach((notDeletedDog) => promises.push(deleteDogForFamilyIdDogUUID(databaseConnection, familyId, notDeletedDog.dogUUID)));

  await Promise.all(promises);
}

export { deleteDogForFamilyIdDogUUID, deleteAllDogsForFamilyId };
