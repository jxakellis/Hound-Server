const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');
const { hash } = require('../../main/tools/format/hash');

const { updateUserForUserIdentifierHashedUserIdentifier } = require('../updateFor/updateForUser');

const userColumns = 'u.userId, u.userApplicationUsername, u.userNotificationToken, u.userFirstName, u.userLastName, u.userEmail';
const userConfigurationColumns = `uc.userConfigurationIsNotificationEnabled, uc.userConfigurationIsLoudNotificationEnabled, 
uc.userConfigurationIsLogNotificationEnabled, uc.userConfigurationIsReminderNotificationEnabled, uc.userConfigurationSnoozeLength, 
uc.userConfigurationNotificationSound, uc.userConfigurationLogsInterfaceScale, uc.userConfigurationRemindersInterfaceScale, 
uc.userConfigurationInterfaceStyle, uc.userConfigurationIsSilentModeEnabled, uc.userConfigurationSilentModeStartUTCHour, 
uc.userConfigurationSilentModeEndUTCHour, uc.userConfigurationSilentModeStartUTCMinute, uc.userConfigurationSilentModeEndUTCMinute`;
const userInformationColumns = `${userColumns}, fm.familyId, ${userConfigurationColumns}`;
const userNameColumns = 'u.userFirstName, u.userLastName';

/**
* If the query is successful, returns the user for the userIdentifier.
 *  If a problem is encountered, creates and throws custom error
 */
async function getUserForUserIdentifier(databaseConnection, userIdentifier) {
  if (areAllDefined(databaseConnection, userIdentifier) === false) {
    throw new ValidationError('databaseConnection or userIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // userIdentifier method of finding corresponding user(s)
  // have to specifically reference the columns, otherwise fm.userId will override u.userId.
  // Therefore setting userId to null (if there is no family member) even though the userId isn't null.
  let [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT ${userInformationColumns}
    FROM users u 
    JOIN userConfiguration uc ON u.userId = uc.userId
    LEFT JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userIdentifier = ?
    LIMIT 1`,
    [userIdentifier],
  );

  const hashedUserIdentifier = hash(userIdentifier);
  if (areAllDefined(userInformation) === false && areAllDefined(hashedUserIdentifier) === true) {
    // If we can't find a user for a userIdentifier, hash that userIdentifier and then try again.
    // This is because we switched from hashing the Apple provided userIdentifier to directly storing it.
    // If query is successful, change saved userIdentifier and return result

    [userInformation] = await databaseQuery(
      databaseConnection,
      `SELECT ${userInformationColumns} 
      FROM users u
      JOIN userConfiguration uc ON u.userId = uc.userId 
      LEFT JOIN familyMembers fm ON u.userId = fm.userId
      WHERE u.userIdentifier = ?
      LIMIT 1`,
      [hashedUserIdentifier],
    );

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

  // have to specifically reference the columns, otherwise fm.userId will override u.userId.
  // Therefore setting userId to null (if there is no family member) even though the userId isn't null.
  const [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT ${userInformationColumns} 
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    LEFT JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userApplicationUsername = ?
    LIMIT 1`,
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
    `SELECT ${userNameColumns}
    FROM users u
    WHERE u.userId = ?
    LIMIT 1`,
    [userId],
  );

  return userInformation;
}

module.exports = {
  getUserForUserIdentifier, getUserForUserApplicationUsername, getUserFirstNameLastNameForUserId,
};
