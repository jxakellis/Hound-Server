const crypto = require('crypto');
const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatNumber, formatEmail, formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { hash } = require('../../main/tools/format/hash');

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
  forUserConfigurationInterfaceStyle,
  forUserConfigurationSnoozeLength,
  userConfigurationNotificationSound,
  userConfigurationLogsInterfaceScale,
  userConfigurationRemindersInterfaceScale,
  // userConfigurationPreviousDogManagerSynchronization,
  forUserConfigurationSilentModeIsEnabled,
  forUserConfigurationSilentModeStartUTCHour,
  forUserConfigurationSilentModeEndUTCHour,
  forUserConfigurationSilentModeStartUTCMinute,
  forUserConfigurationSilentModeEndUTCMinte,
) {
  if (areAllDefined(databaseConnection, userIdentifier) === false) {
    throw new ValidationError('databaseConnection or userIdentifier missing', global.constant.error.value.MISSING);
  }
  const userAccountCreationDate = new Date();
  const userId = hash(userIdentifier, userAccountCreationDate.toISOString());
  // userIdentifier
  const userApplicationUsername = formatString(crypto.randomUUID(), 36);
  const userEmail = formatEmail(forUserEmail);
  const userFirstName = formatString(forUserFirstName, 32);
  const userLastName = formatString(forUserLastName, 32);
  const userNotificationToken = formatString(forUserNotificationToken, 100);

  const userConfigurationIsNotificationEnabled = formatBoolean(forUserConfigurationIsNotificationEnabled);
  const userConfigurationIsLoudNotification = formatBoolean(forUserConfigurationIsLoudNotification);
  const userConfigurationInterfaceStyle = formatNumber(forUserConfigurationInterfaceStyle);
  const userConfigurationSnoozeLength = formatNumber(forUserConfigurationSnoozeLength);
  // userConfigurationNotificationSound
  // userConfigurationLogsInterfaceScale
  // userConfigurationRemindersInterfaceScale
  const userConfigurationSilentModeIsEnabled = formatBoolean(forUserConfigurationSilentModeIsEnabled);
  const userConfigurationSilentModeStartUTCHour = formatNumber(forUserConfigurationSilentModeStartUTCHour);
  const userConfigurationSilentModeEndUTCHour = formatNumber(forUserConfigurationSilentModeEndUTCHour);
  const userConfigurationSilentModeStartUTCMinute = formatNumber(forUserConfigurationSilentModeStartUTCMinute);
  const userConfigurationSilentModeEndUTCMinute = formatNumber(forUserConfigurationSilentModeEndUTCMinte);
  if (areAllDefined(
    userId,
    userIdentifier,
    // userApplicationUsername
    userEmail,
    // userFirstName
    // userLastName
    // userNotificationToken
    userAccountCreationDate,
    userConfigurationIsNotificationEnabled,
    userConfigurationIsLoudNotification,
    userConfigurationInterfaceStyle,
    userConfigurationSnoozeLength,
    userConfigurationNotificationSound,
    userConfigurationLogsInterfaceScale,
    userConfigurationRemindersInterfaceScale,
    userConfigurationSilentModeIsEnabled,
    userConfigurationSilentModeStartUTCHour,
    userConfigurationSilentModeEndUTCHour,
    userConfigurationSilentModeStartUTCMinute,
    userConfigurationSilentModeEndUTCMinute,
  ) === false) {
    throw new ValidationError('userId, userIdentifier, userEmail, userAccountCreationDate, userConfigurationIsNotificationEnabled, userConfigurationIsLoudNotification, userConfigurationInterfaceStyle, userConfigurationSnoozeLength, userConfigurationNotificationSound, userConfigurationLogsInterfaceScale, userConfigurationRemindersInterfaceScale, userConfigurationSilentModeIsEnabled, userConfigurationSilentModeStartUTCHour, userConfigurationSilentModeEndUTCHour, userConfigurationSilentModeStartUTCMinute, or userConfigurationSilentModeEndUTCMinute, missing', global.constant.error.value.MISSING);
  }

  const promises = [
    databaseQuery(
      databaseConnection,
      'INSERT INTO users(userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate) VALUES (?,?,?,?,?,?,?,?)',
      [userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate],
    ),
    databaseQuery(
      databaseConnection,
      'INSERT INTO userConfiguration(userId, userConfigurationIsNotificationEnabled, userConfigurationIsLoudNotification, userConfigurationSnoozeLength, userConfigurationNotificationSound, userConfigurationLogsInterfaceScale, userConfigurationRemindersInterfaceScale, userConfigurationInterfaceStyle, userConfigurationSilentModeIsEnabled, userConfigurationSilentModeStartUTCHour, userConfigurationSilentModeEndUTCHour, userConfigurationSilentModeStartUTCMinute, userConfigurationSilentModeEndUTCMinute) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [userId,
        userConfigurationIsNotificationEnabled,
        userConfigurationIsLoudNotification,
        userConfigurationSnoozeLength,
        userConfigurationNotificationSound,
        userConfigurationLogsInterfaceScale,
        userConfigurationRemindersInterfaceScale,
        userConfigurationInterfaceStyle,
        userConfigurationSilentModeIsEnabled,
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
