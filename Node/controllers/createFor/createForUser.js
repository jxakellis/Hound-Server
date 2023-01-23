const crypto = require('crypto');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { ValidationError } = require('../../main/tools/general/errors');
const {
  formatNumber, formatEmail, formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { hash } = require('../../main/tools/format/hash');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

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
  const userAccountCreationDate = new Date();
  const userId = hash(userIdentifier, userAccountCreationDate.toISOString());
  // userIdentifier
  const userApplicationUsername = formatString(crypto.randomUUID(), 36);
  const userEmail = formatEmail(forUserEmail);
  const userFirstName = formatString(forUserFirstName, 32);
  const userLastName = formatString(forUserLastName, 32);
  const userNotificationToken = formatString(forUserNotificationToken, 100);

  if (areAllDefined(
    userId,
    // userApplicationUsername
    userEmail,
    // userFirstName
    // userLastName
    // userNotificationToken
    userAccountCreationDate,
  ) === false) {
    throw new ValidationError('userId, userEmail, or userAccountCreationDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const userConfigurationIsNotificationEnabled = formatBoolean(forUserConfigurationIsNotificationEnabled) ?? false;
  const userConfigurationIsLoudNotification = formatBoolean(forUserConfigurationIsLoudNotification) ?? false;
  const userConfigurationIsLogNotificationEnabled = formatBoolean(forUserConfigurationIsLogNotificationEnabled) ?? false;
  const userConfigurationIsReminderNotificationEnabled = formatBoolean(forUserConfigurationIsReminderNotificationEnabled) ?? false;
  const userConfigurationInterfaceStyle = formatNumber(forUserConfigurationInterfaceStyle) ?? 0;
  const userConfigurationSnoozeLength = formatNumber(forUserConfigurationSnoozeLength) ?? 300;
  const userConfigurationNotificationSound = forUserConfigurationNotificationSound ?? 'Radar';
  const userConfigurationLogsInterfaceScale = forUserConfigurationLogsInterfaceScale ?? 'Medium';
  const userConfigurationRemindersInterfaceScale = forUserConfigurationRemindersInterfaceScale ?? 'Medium';
  const userConfigurationSilentModeIsEnabled = formatBoolean(forUserConfigurationSilentModeIsEnabled) ?? false;
  const userConfigurationSilentModeStartUTCHour = formatNumber(forUserConfigurationSilentModeStartUTCHour) ?? 7;
  const userConfigurationSilentModeEndUTCHour = formatNumber(forUserConfigurationSilentModeEndUTCHour) ?? 19;
  const userConfigurationSilentModeStartUTCMinute = formatNumber(forUserConfigurationSilentModeStartUTCMinute) ?? 0;
  const userConfigurationSilentModeEndUTCMinute = formatNumber(forUserConfigurationSilentModeEndUTCMinte) ?? 0;

  if (areAllDefined(
    userConfigurationIsNotificationEnabled,
    userConfigurationIsLoudNotification,
    userConfigurationIsLogNotificationEnabled,
    userConfigurationIsReminderNotificationEnabled,
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
    throw new ValidationError('userConfigurationIsNotificationEnabled, \
userConfigurationIsLoudNotification, \
userConfigurationIsLogNotificationEnabled, \
userConfigurationIsReminderNotificationEnabled, \
userConfigurationInterfaceStyle, \
userConfigurationSnoozeLength, \
userConfigurationNotificationSound, \
userConfigurationLogsInterfaceScale, \
userConfigurationRemindersInterfaceScale, \
userConfigurationSilentModeIsEnabled, \
userConfigurationSilentModeStartUTCHour, \
userConfigurationSilentModeEndUTCHour, \
userConfigurationSilentModeStartUTCMinute, \
or userConfigurationSilentModeEndUTCMinute missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [
    databaseQuery(
      databaseConnection,
      'INSERT INTO users(userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate) VALUES (?,?,?,?,?,?,?,?)',
      [userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate],
    ),
    databaseQuery(
      databaseConnection,
      'INSERT INTO userConfiguration(\
userId, \
userConfigurationIsNotificationEnabled, \
userConfigurationIsLoudNotification, \
userConfigurationIsLogNotificationEnabled, \
userConfigurationIsReminderNotificationEnabled, \
userConfigurationSnoozeLength, \
userConfigurationNotificationSound, \
userConfigurationLogsInterfaceScale, \
userConfigurationRemindersInterfaceScale, \
userConfigurationInterfaceStyle, \
userConfigurationSilentModeIsEnabled, \
userConfigurationSilentModeStartUTCHour, \
userConfigurationSilentModeEndUTCHour, \
userConfigurationSilentModeStartUTCMinute, \
userConfigurationSilentModeEndUTCMinute\
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, ?, ?)',
      [userId,
        userConfigurationIsNotificationEnabled,
        userConfigurationIsLoudNotification,
        userConfigurationIsLogNotificationEnabled,
        userConfigurationIsReminderNotificationEnabled,
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
