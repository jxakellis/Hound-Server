import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { getAllDogsForFamilyId } from '../get/getDogs.js';

import { deleteAllLogsForDogUUID } from './logs/deleteLogs.js';
import { deleteAllRemindersForFamilyIdDogUUID } from './reminders/deleteReminders.js';
import { deleteAllTriggersForDogUUID } from './triggers/deleteTriggers.js';

/**
 *  Queries the database to delete a dog and everything nested under it. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteDogForFamilyIdDogUUID(
  databaseConnection: Queryable,
  familyId: string,
  dogUUID: string,
  userId: string,
): Promise<void> {
  await deleteAllRemindersForFamilyIdDogUUID(databaseConnection, familyId, dogUUID, userId);
  await deleteAllLogsForDogUUID(databaseConnection, dogUUID, userId);
  await deleteAllTriggersForDogUUID(databaseConnection, dogUUID, userId);
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogIsDeleted = 1, dogLastModified = CURRENT_TIMESTAMP(), dogLastModifiedBy = ?
    WHERE dogUUID = ?`,
    [userId, dogUUID],
  );
}

/**
 * Queries the database to delete all dog and everything nested under them. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllDogsForFamilyId(databaseConnection: Queryable, familyId: string, userId: string): Promise<void> {
  const notDeletedDogs = await getAllDogsForFamilyId(databaseConnection, familyId, false, false, undefined);

  // delete all the dogs
  const promises: Promise<void>[] = [];
  notDeletedDogs.forEach((notDeletedDog) => promises.push(deleteDogForFamilyIdDogUUID(databaseConnection, familyId, notDeletedDog.dogUUID, userId)));

  await Promise.all(promises);
}

export { deleteDogForFamilyIdDogUUID, deleteAllDogsForFamilyId };
