const { databaseConnectionForGeneral } = require('../../database/createDatabaseConnections');
const { databaseQuery } = require('../../database/databaseQuery');
const { formatBoolean, formatArray } = require('../../format/formatObject');
const { areAllDefined } = require('../../format/validateDefined');

const userConfigurationColumns = 'userConfiguration.userConfigurationNotificationSound, \
userConfiguration.userConfigurationIsLoudNotification, \
userConfiguration.userConfigurationIsLogNotificationEnabled, \
userConfiguration.userConfigurationIsReminderNotificationEnabled, \
userConfiguration.userConfigurationSilentModeIsEnabled, \
userConfiguration.userConfigurationSilentModeStartUTCHour, \
userConfiguration.userConfigurationSilentModeEndUTCHour, \
userConfiguration.userConfigurationSilentModeStartUTCMinute, \
userConfiguration.userConfigurationSilentModeEndUTCMinute';
const userConfigurationJoin = 'JOIN userConfiguration ON users.userId = userConfiguration.userId';
const familyMembersJoin = 'JOIN familyMembers ON users.userId = familyMembers.userId';

/**
 *  Takes a userId
 *  Returns the userNotificationToken and (optionally) userConfigurationNotificationSound of the user if they have a defined userNotificationToken and are notificationEnabled
 *  If an error is encountered, creates and throws custom error
 */
async function getUserToken(userId) {
  if (areAllDefined(userId) === false) {
    return [];
  }
  // retrieve userNotificationToken, userConfigurationNotificationSound, and isLoudNotificaiton of a user with the userId, non-null userNotificationToken, and userConfigurationIsNotificationEnabled
  const result = await databaseQuery(
    databaseConnectionForGeneral,
    `SELECT users.userNotificationToken, ${userConfigurationColumns} \
FROM users ${userConfigurationJoin} \
WHERE users.userId = ? AND users.userNotificationToken IS NOT NULL AND userConfiguration.userConfigurationIsNotificationEnabled = 1 \
LIMIT 1`,
    [userId],
  );

  return parseNotificatonTokenQuery(result);
}

/**
 *  Takes a familyId
 *  Returns the userNotificationToken of users that are in the family, have a defined userNotificationToken, and are notificationEnabled
 * If an error is encountered, creates and throws custom error
 */
async function getAllFamilyMemberTokens(familyId) {
  if (areAllDefined(familyId) === false) {
    return [];
  }
  // retrieve userNotificationToken that fit the criteria
  const result = await databaseQuery(
    databaseConnectionForGeneral,
    `SELECT users.userNotificationToken, ${userConfigurationColumns} \
FROM users ${userConfigurationJoin} ${familyMembersJoin} \
WHERE familyMembers.familyId = ? AND users.userNotificationToken IS NOT NULL AND userConfiguration.userConfigurationIsNotificationEnabled = 1 \
LIMIT 18446744073709551615`,
    [familyId],
  );

  return parseNotificatonTokenQuery(result);
}

/**
 *  Takes a userId and familyId
 *  Returns the userNotificationToken of users that aren't the userId, are in the family, have a defined userNotificationToken, and are notificationEnabled
 * If an error is encountered, creates and throws custom error
 */
async function getOtherFamilyMemberTokens(userId, familyId) {
  if (areAllDefined(userId, familyId) === false) {
    return [];
  }
  // retrieve userNotificationToken that fit the criteria
  const result = await databaseQuery(
    databaseConnectionForGeneral,
    `SELECT users.userNotificationToken, ${userConfigurationColumns} \
FROM users ${userConfigurationJoin} ${familyMembersJoin} \
WHERE users.userId != ? AND familyMembers.familyId = ? AND users.userNotificationToken IS NOT NULL AND userConfiguration.userConfigurationIsNotificationEnabled = 1 \
LIMIT 18446744073709551615`,
    [userId, familyId],
  );

  return parseNotificatonTokenQuery(result);
}

/**
 * Helper method for this file
 * Takes the result from a query for userNotificationToken, userConfigurationNotificationSound, and userConfigurationIsLoudNotification
 * Returns an array of JSON with userNotificationToken and (if userConfigurationIsLoudNotification disabled) userConfigurationNotificationSound
 */
function parseNotificatonTokenQuery(forUserNotificationConfigurations) {
  const userNotificationConfigurations = formatArray(forUserNotificationConfigurations);
  if (areAllDefined(userNotificationConfigurations) === false) {
    return [];
  }

  const processedUserNotificationConfigurations = [];

  // If the user userConfigurationIsLoudNotification enabled, no need for sound in rawPayload as app plays a sound
  // If the user userConfigurationIsLoudNotification disabled, the APN itself have a sound (which will play if the ringer is on)
  for (let i = 0; i < userNotificationConfigurations.length; i += 1) {
    const userNotificationConfiguration = userNotificationConfigurations[i];

    if (formatBoolean(userNotificationConfiguration.userConfigurationIsLoudNotification) === false && areAllDefined(userNotificationConfiguration.userConfigurationNotificationSound)) {
      // loud notification is disabled therefore the notification itself plays a sound (APN needs to specify a notification sound)
      userNotificationConfiguration.userConfigurationNotificationSound = userNotificationConfiguration.userConfigurationNotificationSound.toLowerCase();
    }
    else {
      // loud notification is enabled therefore the Hound app itself plays an audio file (APN shouldn't specify a notification sound)
      delete userNotificationConfiguration.userConfigurationNotificationSound;
    }

    processedUserNotificationConfigurations.push(userNotificationConfiguration);
  }
  return processedUserNotificationConfigurations;
}

module.exports = { getUserToken, getAllFamilyMemberTokens, getOtherFamilyMemberTokens };
