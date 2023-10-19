import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { DogLogsRow } from '../../main/types/DogLogsRow';
import { DogRemindersRow } from '../../main/types/DogRemindersRow';
import { DogsRow, dogsColumns } from '../../main/types/DogsRow';

import { getAllLogsForDogId } from './getForLogs';
import { getAllRemindersForDogId } from './getForReminders';

/**
 *  If the query is successful, returns the dog for the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getDogForDogId(
  databaseConnection: Queryable,
  dogId: number,
  isRetrievingReminders: boolean,
  isRetrievingLogs: boolean,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow | undefined> {
  // if the user provides a last sync, then we look for dogs that were modified after this last sync.
  // Therefore, only providing dogs that were modified and the local client is outdated on
  const dogs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      LEFT JOIN dogReminders dr ON d.dogId = dr.dogId
      LEFT JOIN dogLogs dl ON d.dogId = dl.dogId
      WHERE
      (
        TIMESTAMPDIFF(MICROSECOND, d.dogLastModified, ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, dr.reminderLastModified, ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, dl.logLastModified, ?) <= 0
      )
      AND d.dogId = ?
      GROUP BY d.dogId
      LIMIT 1`,
      [previousDogManagerSynchronization, previousDogManagerSynchronization, previousDogManagerSynchronization, dogId],
    )
    // User is requesting a complete copy of dogs, therefore we can assume they have a blank copy
    // If they have a blank copy, no need to include deleted dogs that indicate whether to delete their local dog store
    : await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      WHERE dogIsDeleted = 0 AND dogId = ?
      GROUP BY dogId
      LIMIT 1`,
      [dogId],
    );

  const dog = dogs.safeIndex(0);

  // no need to do anything else as there are no dogs
  if (dog === undefined) {
    return undefined;
  }

  // if the query parameter indicates that they want the logs and the reminders too, we add them.
  if (isRetrievingReminders) {
    // add all the reminders we want to retrieving into an array, 1:1 corresponding to dogs
    dog.reminders = await getAllRemindersForDogId(databaseConnection, dog.dogId, previousDogManagerSynchronization);
  }

  if (isRetrievingLogs) {
    dog.logs = await getAllLogsForDogId(databaseConnection, dog.dogId, previousDogManagerSynchronization);
  }

  return dog;
}

/**
 *  If the query is successful, returns an array of all the dogs for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllDogsForUserIdFamilyId(
  databaseConnection: Queryable,
  userId: string,
  familyId: string,
  isRetrievingReminders: boolean,
  isRetrievingLogs: boolean,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow[] | undefined> {
  // if the user provides a last sync, then we look for dogs that were modified after this last sync. Therefore, only providing dogs that were modified and the local client is outdated on
  const dogs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      LEFT JOIN dogReminders dr ON d.dogId = dr.dogId
      LEFT JOIN dogLogs dl ON d.dogId = dl.dogId
      WHERE (
        TIMESTAMPDIFF(MICROSECOND, d.dogLastModified, ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, dr.reminderLastModified, ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, dl.logLastModified, ?) <= 0
      )
      AND d.familyId = ?
      GROUP BY d.dogId
      LIMIT 18446744073709551615`,
      [previousDogManagerSynchronization, previousDogManagerSynchronization, previousDogManagerSynchronization, familyId],
    )
    // User is requesting a complete copy of dogs, therefore we can assume they have a blank copy
    // If they have a blank copy, no need to include deleted dogs that indicate whether to delete their local dog store
    : await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      WHERE dogIsDeleted = 0 AND familyId = ?
      GROUP BY dogId
      LIMIT 18446744073709551615`,
      [familyId],
    );

  // if the query parameter indicates that they want the logs and the reminders too, we add them.
  if (isRetrievingReminders) {
    const reminderPromises: Promise<DogRemindersRow[]>[] = [];
    // add all the reminders we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => reminderPromises.push(getAllRemindersForDogId(databaseConnection, dog.dogId, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const remindersForDogs = await Promise.all(reminderPromises);

    remindersForDogs.forEach((remindersForDog, index) => {
      dogs[index].reminders = remindersForDog;
    });
  }

  if (isRetrievingLogs) {
    const logPromises: Promise<DogLogsRow[]>[] = [];
    // add all the logs we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => logPromises.push(getAllLogsForDogId(databaseConnection, dog.dogId, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const logsForDogs = await Promise.all(logPromises);

    // since logPromises is 1:1 and index the same as dogs, we can take the resolved logPromises and assign to the dogs in the dogs array
    logsForDogs.forEach((logsForDog, index) => {
      dogs[index].logs = logsForDog;
    });
  }

  // If the user retrieved the most updated information from the dog (by getting reminders and logs and providing a lastSynchronization), we update
  if (previousDogManagerSynchronization !== undefined && isRetrievingReminders && isRetrievingLogs) {
    // This function is retrieving the all dogs for a given familyId.
    // If the user also specified to get reminders and logs, that means this query is retrieving the ENTIRE dog manager
    // Therefore, the user's previousDogManagerSynchronization should be saved as this counts as a dogManagerSyncronization
    await databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET previousDogManagerSynchronization = ?
      WHERE userId = ?`,
      [previousDogManagerSynchronization, userId],
    );
  }

  return dogs;
}

export { getDogForDogId, getAllDogsForUserIdFamilyId };
