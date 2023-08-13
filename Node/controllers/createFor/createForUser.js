const crypto = require('crypto');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { ValidationError } = require('../../main/tools/general/errors');
const {
  formatNumber, formatEmail, formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { hash } = require('../../main/tools/format/hash');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');

const { getUserForUserIdentifier } = require('../getFor/getForUser');

/**
 *  Queries the database to create a user. If the query is successful, then returns the userId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createUserForUserIdentifier(
  databaseConnection,
  // userId,
  userIdentifier,
  // userApplicationUsername,
  forUserEmail,
  forUserFirstName,
  forUserLastName,
  forUserNotificationToken,
  // userAccountCreationDate,
  forUserConfigurationIsNotificationEnabled,
  forUserConfigurationIsLoudNotification,
  forUserConfigurationIsLogNotificationEnabled,
  forUserConfigurationIsReminderNotificationEnabled,
  forUserConfigurationInterfaceStyle,
  forUserConfigurationSnoozeLength,
  forUserConfigurationNotificationSound,
  forUserConfigurationLogsInterfaceScale,
  forUserConfigurationRemindersInterfaceScale,
  // userConfigurationPreviousDogManagerSynchronization,
  forUserConfigurationSilentModeIsEnabled,
  forUserConfigurationSilentModeStartUTCHour,
  forUserConfigurationSilentModeEndUTCHour,
  forUserConfigurationSilentModeStartUTCMinute,
  forUserConfigurationSilentModeEndUTCMinte,
) {
  if (areAllDefined(databaseConnection, userIdentifier) === false) {
    throw new ValidationError('databaseConnection or userIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const existingUser = await getUserForUserIdentifier(databaseConnection, userIdentifier);

  if (areAllDefined(existingUser) === true) {
    return existingUser.userId;
  }

  const userId = hash(userIdentifier);
  // userIdentifier
  const userApplicationUsername = formatString(crypto.randomUUID(), 36);
  const userEmail = formatEmail(forUserEmail);
  const userFirstName = formatString(forUserFirstName, 32);
  const userLastName = formatString(forUserLastName, 32);
  const userNotificationToken = formatString(forUserNotificationToken, 100);

  if (areAllDefined(
    userId,
    // userApplicationUsername
    // userEmail,
    // userFirstName
    // userLastName
    // userNotificationToken
  ) === false) {
    throw new ValidationError('userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationIsNotificationEnabled = formatBoolean(forUserConfigurationIsNotificationEnabled) ?? false;
  const userConfigurationIsLoudNotificationEnabled = formatBoolean(forUserConfigurationIsLoudNotification) ?? false;
  const userConfigurationIsLogNotificationEnabled = formatBoolean(forUserConfigurationIsLogNotificationEnabled) ?? false;
  const userConfigurationIsReminderNotificationEnabled = formatBoolean(forUserConfigurationIsReminderNotificationEnabled) ?? false;
  const userConfigurationInterfaceStyle = formatNumber(forUserConfigurationInterfaceStyle) ?? 0;
  const userConfigurationSnoozeLength = formatNumber(forUserConfigurationSnoozeLength) ?? 300;
  const userConfigurationNotificationSound = forUserConfigurationNotificationSound ?? 'Radar';
  const userConfigurationLogsInterfaceScale = forUserConfigurationLogsInterfaceScale ?? 'Medium';
  const userConfigurationRemindersInterfaceScale = forUserConfigurationRemindersInterfaceScale ?? 'Medium';
  const userConfigurationIsSilentModeEnabled = formatBoolean(forUserConfigurationSilentModeIsEnabled) ?? false;
  const userConfigurationSilentModeStartUTCHour = formatNumber(forUserConfigurationSilentModeStartUTCHour) ?? 7;
  const userConfigurationSilentModeEndUTCHour = formatNumber(forUserConfigurationSilentModeEndUTCHour) ?? 19;
  const userConfigurationSilentModeStartUTCMinute = formatNumber(forUserConfigurationSilentModeStartUTCMinute) ?? 0;
  const userConfigurationSilentModeEndUTCMinute = formatNumber(forUserConfigurationSilentModeEndUTCMinte) ?? 0;

  if (areAllDefined(
    userConfigurationIsNotificationEnabled,
    userConfigurationIsLoudNotificationEnabled,
    userConfigurationIsLogNotificationEnabled,
    userConfigurationIsReminderNotificationEnabled,
    userConfigurationInterfaceStyle,
    userConfigurationSnoozeLength,
    userConfigurationNotificationSound,
    userConfigurationLogsInterfaceScale,
    userConfigurationRemindersInterfaceScale,
    userConfigurationIsSilentModeEnabled,
    userConfigurationSilentModeStartUTCHour,
    userConfigurationSilentModeEndUTCHour,
    userConfigurationSilentModeStartUTCMinute,
    userConfigurationSilentModeEndUTCMinute,
  ) === false) {
    throw new ValidationError(`userConfigurationIsNotificationEnabled,
userConfigurationIsLoudNotificationEnabled,
userConfigurationIsLogNotificationEnabled,
userConfigurationIsReminderNotificationEnabled,
userConfigurationInterfaceStyle,
userConfigurationSnoozeLength,
userConfigurationNotificationSound,
userConfigurationLogsInterfaceScale,
userConfigurationRemindersInterfaceScale,
userConfigurationIsSilentModeEnabled,
userConfigurationSilentModeStartUTCHour,
userConfigurationSilentModeEndUTCHour,
userConfigurationSilentModeStartUTCMinute,
or userConfigurationSilentModeEndUTCMinute missing`, global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [
    databaseQuery(
      databaseConnection,
      `INSERT INTO users
      (userId, userIdentifier, userApplicationUsername, userEmail,
        userFirstName, userLastName, userNotificationToken, userAccountCreationDate) 
      VALUES (?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP())`,
      [userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken],
    ),
    databaseQuery(
      databaseConnection,
      `INSERT INTO userConfiguration
      (userId, userConfigurationIsNotificationEnabled, userConfigurationIsLoudNotificationEnabled, 
      userConfigurationIsLogNotificationEnabled, userConfigurationIsReminderNotificationEnabled, 
      userConfigurationSnoozeLength, userConfigurationNotificationSound, userConfigurationLogsInterfaceScale, 
      userConfigurationRemindersInterfaceScale, userConfigurationInterfaceStyle, userConfigurationIsSilentModeEnabled, 
      userConfigurationSilentModeStartUTCHour, userConfigurationSilentModeEndUTCHour, userConfigurationSilentModeStartUTCMinute, 
      userConfigurationSilentModeEndUTCMinute) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId,
        userConfigurationIsNotificationEnabled,
        userConfigurationIsLoudNotificationEnabled,
        userConfigurationIsLogNotificationEnabled,
        userConfigurationIsReminderNotificationEnabled,
        userConfigurationSnoozeLength,
        userConfigurationNotificationSound,
        userConfigurationLogsInterfaceScale,
        userConfigurationRemindersInterfaceScale,
        userConfigurationInterfaceStyle,
        userConfigurationIsSilentModeEnabled,
        userConfigurationSilentModeStartUTCHour,
        userConfigurationSilentModeEndUTCHour,
        userConfigurationSilentModeStartUTCMinute,
        userConfigurationSilentModeEndUTCMinute,
      ],
    )];
  await Promise.all(promises);

  return userId;
}

module.exports = { createUserForUserIdentifier };
