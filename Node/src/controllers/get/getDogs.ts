import { type DogTriggersRow } from '../../main/types/rows/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type DogLogsRow } from '../../main/types/rows/DogLogsRow.js';
import { type DogRemindersRow } from '../../main/types/rows/DogRemindersRow.js';
import { type DogsRow, type DogsRowWithRemindersLogsTriggers, dogsColumns } from '../../main/types/rows/DogsRow.js';

import { getAllLogsForDogUUID } from './getLogs.js';
import { getAllRemindersForDogUUID } from './reminders/getReminders.js';
import { getAllTriggersForDogUUID } from './triggers/getTriggers.js';

// Overload the function signatures to return different types depending upon includeRemindersLogsTriggers
async function getDogForDogUUID(
  databaseConnection: Queryable,
  dogUUID: string,
  includeDeletedDogs: boolean,
  includeRemindersLogsTriggers: false,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow | undefined>;
async function getDogForDogUUID(
  databaseConnection: Queryable,
  dogUUID: string,
  includeDeletedDogs: boolean,
  includeRemindersLogsTriggers: true,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRowWithRemindersLogsTriggers | undefined>;

/**
 * If you are querying a single elements from the database, previousDogManagerSynchronization is not taken.
 * We always want to fetch the specified element.
 * However, previousDogManagerSynchronization is taken here as we are querying multiple sub elements for the dog (logs and reminders)
 */
async function getDogForDogUUID(
  databaseConnection: Queryable,
  dogUUID: string,
  includeDeletedDogs: boolean,
  includeRemindersLogsTriggers: boolean,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow | DogsRowWithRemindersLogsTriggers | undefined> {
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

  if (includeRemindersLogsTriggers === true) {
    const [reminders, logs, triggers] = await Promise.all([
      getAllRemindersForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization),
      getAllLogsForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization),
      getAllTriggersForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization),
    ]);

    (dog as DogsRowWithRemindersLogsTriggers).dogReminders = reminders;
    (dog as DogsRowWithRemindersLogsTriggers).dogLogs = logs;
    (dog as DogsRowWithRemindersLogsTriggers).dogTriggers = triggers;
  }

  return dog;
}

// Overload the function signatures to return different types depending upon includeRemindersLogsTriggers
async function getAllDogsForFamilyId(
  databaseConnection: Queryable,
  familyId: string,
  includeDeletedDogs: boolean,
  includeRemindersLogsTriggers: false,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow[]>;
async function getAllDogsForFamilyId(
  databaseConnection: Queryable,
  familyId: string,
  includeDeletedDogs: boolean,
  includeRemindersLogsTriggers: true,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRowWithRemindersLogsTriggers[]>;

/**
 * If you are querying a multiple elements from the database, previousDogManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllDogsForFamilyId(
  databaseConnection: Queryable,
  familyId: string,
  includeDeletedDogs: boolean,
  includeRemindersLogsTriggers: boolean,
  previousDogManagerSynchronization?: Date,
): Promise<DogsRow[] | DogsRowWithRemindersLogsTriggers[]> {
  // if the user provides a last sync, then we look for dogs that were modified after this last sync. Therefore, only providing dogs that were modified and the local client is outdated on
  let dogs = previousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
      FROM dogs d
      LEFT JOIN dogReminders dr ON d.dogUUID = dr.dogUUID
      LEFT JOIN dogLogs dl ON d.dogUUID = dl.dogUUID
      LEFT JOIN dogTriggers dt ON d.dogUUID = dt.dogUUID
      WHERE d.familyId = ? 
      AND (
        TIMESTAMPDIFF(MICROSECOND, COALESCE(d.dogLastModified, d.dogCreated), ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, COALESCE(dr.reminderLastModified, dr.reminderCreated), ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, COALESCE(dl.logLastModified, dl.logCreated), ?) <= 0
        OR TIMESTAMPDIFF(MICROSECOND, COALESCE(dt.triggerLastModified, dt.triggerCreated), ?) <= 0
      )
      GROUP BY d.dogUUID
      LIMIT 18446744073709551615`,
      [familyId, previousDogManagerSynchronization, previousDogManagerSynchronization, previousDogManagerSynchronization, previousDogManagerSynchronization],
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

  if (includeRemindersLogsTriggers === true) {
    const reminderPromises: Promise<DogRemindersRow[]>[] = [];
    // add all the reminders we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => reminderPromises.push(getAllRemindersForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const remindersForDogs = await Promise.all(reminderPromises);
    // since reminderPromises is 1:1 and index the same as dogs, we can take the resolved reminderPromises and assign to the dogs in the dogs array
    remindersForDogs.forEach((remindersForDog, index) => {
      (dogs[index] as DogsRowWithRemindersLogsTriggers).dogReminders = remindersForDog;
    });

    const logPromises: Promise<DogLogsRow[]>[] = [];
    // add all the logs we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => logPromises.push(getAllLogsForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const logsForDogs = await Promise.all(logPromises);
    // since logPromises is 1:1 and index the same as dogs, we can take the resolved logPromises and assign to the dogs in the dogs array
    logsForDogs.forEach((logsForDog, index) => {
      (dogs[index] as DogsRowWithRemindersLogsTriggers).dogLogs = logsForDog;
    });

    const triggerPromises: Promise<DogTriggersRow[]>[] = [];
    // add all the triggers we want to retrieving into an array, 1:1 corresponding to dogs
    dogs.forEach((dog) => triggerPromises.push(getAllTriggersForDogUUID(databaseConnection, dog.dogUUID, includeDeletedDogs, previousDogManagerSynchronization)));

    // resolve this array (or throw error for whole request if there is a problem)
    const triggersForDogs = await Promise.all(triggerPromises);
    // since triggerPromises is 1:1 and index the same as dogs, we can take the resolved triggerPromises and assign to the dogs in the dogs array
    triggersForDogs.forEach((triggersForDog, index) => {
      (dogs[index] as DogsRowWithRemindersLogsTriggers).dogTriggers = triggersForDog;
    });
  }

  return dogs;
}

export { getDogForDogUUID, getAllDogsForFamilyId };
