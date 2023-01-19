const crypto = require('crypto');
const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatNumber, formatEmail, formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { hash } = require('../../main/tools/format/hash');

// TO DO NOW only when creating an account, if a predictable value isn't specified (e.g. isNotificationEnabled), assign it the default value used within the Hound app. Decreases chances of sign-up failing
// TO DO NOW add cross compatibility for both old and new naming schemes (e.g. isLoudNotification and isLoudNotificationEnabled). First search for new value then, if not found, attempt to search for value under old key.

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

  const userConfigurationIsNotificationEnabled = formatBoolean(forUserConfigurationIsNotificationEnabled);
  const userConfigurationIsLoudNotification = formatBoolean(forUserConfigurationIsLoudNotification);
  const userConfigurationIsLogNotificationEnabled = formatBoolean(forUserConfigurationIsLogNotificationEnabled);
  const userConfigurationIsReminderNotificationEnabled = formatBoolean(forUserConfigurationIsReminderNotificationEnabled);
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
    throw new ValidationError('userId, \
userIdentifier, \
userEmail, \
userAccountCreationDate, \
userConfigurationIsNotificationEnabled, \
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
