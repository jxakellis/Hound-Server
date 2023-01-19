const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean, formatDate,
} = require('../../main/tools/format/formatObject');
const { areAllDefined, atLeastOneDefined } = require('../../main/tools/format/validateDefined');
const { getAllLogsForDogId } = require('./getForLogs');
const { getAllRemindersForDogId } = require('./getForReminders');

// Select every column except for familyId, and dogLastModified (by not transmitting, increases network efficiency)
// familyId is already known, and dogLastModified has no use client-side
// TO DO FUTURE only select dogId and dogIsDeleted if dogIsDeleted = 0, otherwise include all columns
// TO DO FUTURE if userConfigurationPreviousDogManagerSynchronization > dogLastModified, only select dogId and dogIdDeleted. Otherwise, select all columns (including dogIcon)
const dogsColumns = 'dogs.dogId, dogs.dogName, dogs.dogIsDeleted';

/**
 *  If the query is successful, returns the dog for the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getDogForDogId(databaseConnection, dogId, forUserConfigurationPreviousDogManagerSynchronization, forIsRetrievingReminders, forIsRetrievingLogs) {
  if (areAllDefined(databaseConnection, dogId) === false) {
    throw new ValidationError('databaseConnection or dogId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationPreviousDogManagerSynchronization = formatDate(forUserConfigurationPreviousDogManagerSynchronization);

  // if the user provides a last sync, then we look for dogs that were modified after this last sync.
  // Therefore, only providing dogs that were modified and the local client is outdated on
  let dog = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogsColumns} \
FROM dogs LEFT JOIN dogReminders ON dogs.dogId = dogReminders.dogId \
LEFT JOIN dogLogs ON dogs.dogId = dogLogs.dogId \
WHERE (dogLastModified >= ? OR reminderLastModified >= ? OR logLastModified >= ?) AND dogs.dogId = ? \
GROUP BY dogs.dogId \
LIMIT 1`,
      [userConfigurationPreviousDogManagerSynchronization, userConfigurationPreviousDogManagerSynchronization, userConfigurationPreviousDogManagerSynchronization, dogId],
    )
    // User is requesting a complete copy of dogs, therefore we can assume they have a blank copy
    // If they have a blank copy, no need to include deleted dogs that indicate whether to delete their local dog store
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogsColumns} FROM dogs WHERE dogIsDeleted = 0 AND dogId = ? GROUP BY dogs.dogId LIMIT 1`,
      [dogId],
    );

  [dog] = dog;

  // no need to do anything else as there are no dogs
  if (areAllDefined(dog) === false) {
    return dog;
  }

  const isRetrievingReminders = formatBoolean(forIsRetrievingReminders);
  const isRetrievingLogs = formatBoolean(forIsRetrievingLogs);
  if (atLeastOneDefined(isRetrievingReminders, isRetrievingLogs) === false) {
    return dog;
  }

  // if the query parameter indicates that they want the logs and the reminders too, we add them.
  if (areAllDefined(isRetrievingReminders) && isRetrievingReminders) {
    // add all the reminders we want to retrieving into an array, 1:1 corresponding to dogs
    dog.reminders = await getAllRemindersForDogId(databaseConnection, dog.dogId, userConfigurationPreviousDogManagerSynchronization);
  }

  if (areAllDefined(isRetrievingLogs) && isRetrievingLogs) {
    dog.logs = await getAllLogsForDogId(databaseConnection, dog.dogId, userConfigurationPreviousDogManagerSynchronization);
  }

  return dog;
}

/**
 *  If the query is successful, returns an array of all the dogs for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllDogsForUserIdFamilyId(databaseConnection, userId, familyId, forUserConfigurationPreviousDogManagerSynchronization, forIsRetrievingReminders, forIsRetrievingLogs) {
  // userId part is optional until later
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationPreviousDogManagerSynchronization = formatDate(forUserConfigurationPreviousDogManagerSynchronization);

  // if the user provides a last sync, then we look for dogs that were modified after this last sync. Therefore, only providing dogs that were modified and the local client is outdated on
  const dogs = areAllDefined(userConfigurationPreviousDogManagerSynchronization)
    ? await databaseQuery(
      databaseConnection,
      `SELECT ${dogsColumns} \
FROM dogs LEFT JOIN dogReminders ON dogs.dogId = dogReminders.dogId \
LEFT JOIN dogLogs ON dogs.dogId = dogLogs.dogId \
WHERE (dogLastModified >= ? OR reminderLastModified >= ? OR logLastModified >= ?) AND dogs.familyId = ? \
GROUP BY dogs.dogId \
LIMIT 18446744073709551615`,
      [userConfigurationPreviousDogManagerSynchronization, userConfigurationPreviousDogManagerSynchronization, userConfigurationPreviousDogManagerSynchronization, familyId],
    )
    // User is requesting a complete copy of dogs, therefore we can assume they have a blank copy
    // If they have a blank copy, no need to include deleted dogs that indicate whether to delete their local dog store
    : await databaseQuery(
      databaseConnection,
      `SELECT ${dogsColumns} FROM dogs WHERE dogIsDeleted = 0 AND familyId = ? GROUP BY dogs.dogId LIMIT 18446744073709551615`,
      [familyId],
    );

  // no need to do anything else as there are no dogs
  if (dogs.length === 0) {
    return dogs;
  }

  const isRetrievingReminders = formatBoolean(forIsRetrievingReminders);
  const isRetrievingLogs = formatBoolean(forIsRetrievingLogs);
  if (atLeastOneDefined(isRetrievingReminders, isRetrievingLogs) === false) {
    return dogs;
  }

  // if the query parameter indicates that they want the logs and the reminders too, we add them.
  if (areAllDefined(isRetrievingReminders) && isRetrievingReminders) {
    let reminderPromises = [];
    // add all the reminders we want to retrieving into an array, 1:1 corresponding to dogs
    for (let i = 0; i < dogs.length; i += 1) {
      reminderPromises.push(getAllRemindersForDogId(databaseConnection, dogs[i].dogId, userConfigurationPreviousDogManagerSynchronization));
    }

    // resolve this array (or throw error for whole request if there is a problem)
    reminderPromises = await Promise.all(reminderPromises);

    // since reminderPromises is 1:1 and index the same as dogs, we can take the resolved reminderPromises and assign to the dogs in the dogs array
    for (let i = 0; i < reminderPromises.length; i += 1) {
      dogs[i].reminders = reminderPromises[i];
    }
  }

  if (areAllDefined(isRetrievingLogs) && isRetrievingLogs) {
    let logPromises = [];
    // add all the logs we want to retrieving into an array, 1:1 corresponding to dogs
    for (let i = 0; i < dogs.length; i += 1) {
      logPromises.push(getAllLogsForDogId(databaseConnection, dogs[i].dogId, userConfigurationPreviousDogManagerSynchronization));
    }

    // resolve this array (or throw error for whole request if there is a problem)
    logPromises = await Promise.all(logPromises);

    // since logPromises is 1:1 and index the same as dogs, we can take the resolved logPromises and assign to the dogs in the dogs array
    for (let i = 0; i < logPromises.length; i += 1) {
      dogs[i].logs = logPromises[i];
    }
  }

  // If the user retrieved the most updated information from the dog (by getting reminders and logs and providing a lastSynchronization), we update
  if (areAllDefined(userId, userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs) && isRetrievingReminders && isRetrievingLogs) {
    // This function is retrieving the all dogs for a given familyId.
    // If the user also specified to get reminders and logs, that means this query is retrieving the ENTIRE dog manager
    // Therefore, the user's userConfigurationPreviousDogManagerSynchronization should be saved as this counts as a dogManagerSyncronization
    await databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationPreviousDogManagerSynchronization = ? WHERE userId = ?',
      [userConfigurationPreviousDogManagerSynchronization, userId],
    );
  }

  return dogs;
}

module.exports = { getDogForDogId, getAllDogsForUserIdFamilyId };
