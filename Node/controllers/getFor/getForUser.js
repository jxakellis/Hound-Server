const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');
const { hash } = require('../../main/tools/format/hash');

const { updateUserForUserIdentifierHashedUserIdentifier } = require('../updateFor/updateForUser');

const userColumns = 'users.userId, users.userApplicationUsername, users.userNotificationToken, users.userFirstName, users.userLastName, users.userEmail';
const userConfigurationColumns = 'userConfiguration.userConfigurationIsNotificationEnabled, \
userConfiguration.userConfigurationIsLoudNotificationEnabled, \
userConfiguration.userConfigurationIsLogNotificationEnabled, \
userConfiguration.userConfigurationIsReminderNotificationEnabled, \
userConfiguration.userConfigurationSnoozeLength, \
userConfiguration.userConfigurationNotificationSound, \
userConfiguration.userConfigurationLogsInterfaceScale, \
userConfiguration.userConfigurationRemindersInterfaceScale, \
userConfiguration.userConfigurationInterfaceStyle, \
userConfiguration.userConfigurationIsSilentModeEnabled, \
userConfiguration.userConfigurationSilentModeStartUTCHour, \
userConfiguration.userConfigurationSilentModeEndUTCHour, \
userConfiguration.userConfigurationSilentModeStartUTCMinute, \
userConfiguration.userConfigurationSilentModeEndUTCMinute';
const userInformationColumns = `${userColumns}, familyMembers.familyId, ${userConfigurationColumns}`;
const userNameColumns = 'users.userFirstName, users.userLastName';

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
  const [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT ${userInformationColumns} \
FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
WHERE users.userId = ? LIMIT 1`,
    [userId],
  );

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
  let [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT ${userInformationColumns} \
FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
WHERE users.userIdentifier = ? LIMIT 1`,
    [userIdentifier],
  );

  const hashedUserIdentifier = hash(userIdentifier);
  console.log(`get user for user identifier, ${userInformation}, ${hashedUserIdentifier}`);
  if (areAllDefined(userInformation) === false && areAllDefined(hashedUserIdentifier) === true) {
    // If we can't find a user for a userIdentifier, hash that userIdentifier and then try again.
    // This is because we switched from hashing the Apple provided userIdentifier to directly storing it.
    // If query is successful, change saved userIdentifier and return result

    [userInformation] = await databaseQuery(
      databaseConnection,
      `SELECT ${userInformationColumns} \
  FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
  LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
  WHERE users.userIdentifier = ? LIMIT 1`,
      [hashedUserIdentifier],
    );
    console.log(`got user for old user identifier, ${userInformation}`);

    if (areAllDefined(userInformation) === true) {
      await updateUserForUserIdentifierHashedUserIdentifier(
        databaseConnection,
        userIdentifier,
        hashedUserIdentifier,
      );
    }
  }

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
  const [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT ${userInformationColumns} \
FROM users JOIN userConfiguration ON users.userId = userConfiguration.userId \
LEFT JOIN familyMembers ON users.userId = familyMembers.userId \
WHERE users.userApplicationUsername = ? LIMIT 1`,
    [userApplicationUsername],
  );

  return userInformation;
}

async function getUserFirstNameLastNameForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT ${userNameColumns} FROM users WHERE users.userId = ? LIMIT 1`,
    [userId],
  );

  return userInformation;
}

module.exports = {
  getUserForUserId, getUserForUserIdentifier, getUserForUserApplicationUsername, getUserFirstNameLastNameForUserId,
};
