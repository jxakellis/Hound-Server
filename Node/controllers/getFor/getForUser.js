const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const userColumns = 'users.userId, users.userApplicationUsername, users.userNotificationToken, users.userFirstName, users.userLastName, users.userEmail';
const userNameColumns = 'users.userFirstName, users.userLastName';
const userConfigurationColumns = 'userConfiguration.userConfigurationIsNotificationEnabled, \
userConfiguration.userConfigurationIsLoudNotification, \
userConfiguration.userConfigurationIsLogNotificationEnabled, \
userConfiguration.userConfigurationIsReminderNotificationEnabled, \
userConfiguration.userConfigurationSnoozeLength, \
userConfiguration.userConfigurationNotificationSound, \
userConfiguration.userConfigurationLogsInterfaceScale, \
userConfiguration.userConfigurationRemindersInterfaceScale, \
userConfiguration.userConfigurationInterfaceStyle, \
userConfiguration.userConfigurationSilentModeIsEnabled, \
userConfiguration.userConfigurationSilentModeStartUTCHour, \
userConfiguration.userConfigurationSilentModeEndUTCHour, \
userConfiguration.userConfigurationSilentModeStartUTCMinute, \
userConfiguration.userConfigurationSilentModeEndUTCMinute';

/**
 * If the query is successful, returns the user for the userId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getUserForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // have to specifically reference the columns, otherwise familyMembers.userId will override users.userId.
  // Therefore setting userId to null (if there is no family member) even though the userId isn't null.
  let userInformation = await databaseQuery(
    databaseConnection,
    `SELECT ${userColumns}, familyMembers.familyId, ${userConfigurationColumns} \
FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
WHERE users.userId = ? LIMIT 1`,
    [userId],
  );
  [userInformation] = userInformation;

  return userInformation;
}

/**
* If the query is successful, returns the user for the userIdentifier.
 *  If a problem is encountered, creates and throws custom error
 */
async function getUserForUserIdentifier(databaseConnection, userIdentifier) {
  if (areAllDefined(databaseConnection, userIdentifier) === false) {
    throw new ValidationError('databaseConnection or userIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // userIdentifier method of finding corresponding user(s)
  // have to specifically reference the columns, otherwise familyMembers.userId will override users.userId.
  // Therefore setting userId to null (if there is no family member) even though the userId isn't null.
  let userInformation = await databaseQuery(
    databaseConnection,
    `SELECT ${userColumns}, familyMembers.familyId, ${userConfigurationColumns} \
FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
WHERE users.userIdentifier = ? LIMIT 1`,
    [userIdentifier],
  );
  [userInformation] = userInformation;

  // array has item(s), meaning there was a user found, successful!
  return userInformation;
}

/**
*  If the query is successful, returns the user for the userApplicationUsername.
 * If a problem is encountered, creates and throws custom error
 */
async function getUserForUserApplicationUsername(databaseConnection, userApplicationUsername) {
  if (areAllDefined(databaseConnection, userApplicationUsername) === false) {
    throw new ValidationError('databaseConnection or userApplicationUsername missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // have to specifically reference the columns, otherwise familyMembers.userId will override users.userId.
  // Therefore setting userId to null (if there is no family member) even though the userId isn't null.
  let userInformation = await databaseQuery(
    databaseConnection,
    `SELECT ${userColumns}, familyMembers.familyId, ${userConfigurationColumns} \
FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
WHERE users.userApplicationUsername = ? LIMIT 1`,
    [userApplicationUsername],
  );
  [userInformation] = userInformation;

  return userInformation;
}

async function getUserFirstNameLastNameForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  let userInformation = await databaseQuery(
    databaseConnection,
    `SELECT ${userNameColumns} FROM users WHERE users.userId = ? LIMIT 1`,
    [userId],
  );
  [userInformation] = userInformation;

  return userInformation;
}

module.exports = {
  getUserForUserId, getUserForUserIdentifier, getUserForUserApplicationUsername, getUserFirstNameLastNameForUserId,
};
