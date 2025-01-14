import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type DogLogsRow } from '../../main/types/DogLogsRow.js';
import { type DogRemindersRow } from '../../main/types/DogRemindersRow.js';
import { type DogsRow, dogsColumns } from '../../main/types/DogsRow.js';

import { getAllLogsForDogUUID } from './getForLogs.js';
import { getAllRemindersForDogUUID } from './getForReminders.js';

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 * However, previousDogManagerSynchronization is taken here as we are querying multiple sub elements for the dog (logs and reminders)
 */
async function getDogForDogUUID(
  databaseConnection: Queryable,
  dogUUID: string,
  includeDeletedDogs: boolean,
  includeRemindersAndLogs: boolean,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow | undefined> {
  let dogs = await databaseQuery<DogsRow[]>(
    databaseConnection,
    `SELECT ${dogsColumns}
      FROM dogs d
      WHERE dogUUID = ?
      GROUP BY dogUUID
      LIMIT 1`,
    [dogUUID],
  );

  if (includeDeletedDogs === false) {
    dogs = dogs.filter((possiblyDeletedDog) => possiblyDeletedDog.dogIsDeleted === 0);
  }

  const dog = dogs.safeIndex(0);

  // no need to do anything else as there are no dogs
  if (dog === undefined || dog === null) {
    return undefined;
  }

  if (includeRemindersAndLogs === true) {
    dog.reminders = await getAllRemindersForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization);
    dog.logs = await getAllLogsForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization);
  }

  return dog;
}

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllDogsForFamilyId(
  databaseConnection: Queryable,
  familyId: string,
  includeDeletedDogs: boolean,
  includeRemindersAndLogs: boolean,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow[]> {
  // if the user provides a last sync, then we look for dogs that were modified after this last sync. Therefore, only providing dogs that were modified and the local client is outdated on
  let dogs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      LEFT JOIN dogReminders dr ON d.dogUUID = dr.dogUUID
      LEFT JOIN dogLogs dl ON d.dogUUID = dl.dogUUID
      WHERE d.familyId = ? AND (
        TIMESTAMPDIFF(MICROSECOND, d.dogLastModified, ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, dr.reminderLastModified, ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, dl.logLastModified, ?) <= 0
      )
      GROUP BY d.dogUUID
      LIMIT 18446744073709551615`,
      [familyId, previousDogManagerSynchronization, previousDogManagerSynchronization, previousDogManagerSynchronization],
    )
    // User is requesting a complete copy of dogs, therefore we can assume they have a blank copy
    // If they have a blank copy, no need to include deleted dogs that indicate whether to delete their local dog store
    : await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      WHERE familyId = ?
      GROUP BY dogUUID
      LIMIT 18446744073709551615`,
      [familyId],
    );

  if (includeDeletedDogs === false) {
    dogs = dogs.filter((possiblyDeletedDog) => possiblyDeletedDog.dogIsDeleted === 0);
  }

  if (includeRemindersAndLogs === true) {
    const reminderPromises: Promise<DogRemindersRow[]>[] = [];
    // add all the reminders we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => reminderPromises.push(getAllRemindersForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const remindersForDogs = await Promise.all(reminderPromises);
    // since reminderPromises is 1:1 and index the same as dogs, we can take the resolved reminderPromises and assign to the dogs in the dogs array
    remindersForDogs.forEach((remindersForDog, index) => {
      dogs[index].reminders = remindersForDog;
    });

    const logPromises: Promise<DogLogsRow[]>[] = [];
    // add all the logs we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => logPromises.push(getAllLogsForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const logsForDogs = await Promise.all(logPromises);
    // since logPromises is 1:1 and index the same as dogs, we can take the resolved logPromises and assign to the dogs in the dogs array
    logsForDogs.forEach((logsForDog, index) => {
      dogs[index].logs = logsForDog;
    });
  }

  return dogs;
}

export { getDogForDogUUID, getAllDogsForFamilyId };
