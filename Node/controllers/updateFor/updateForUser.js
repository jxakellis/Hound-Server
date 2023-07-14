const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatNumber, formatBoolean, formatSHA256Hash, formatString,
} = require('../../main/tools/format/formatObject');
const { hash } = require('../../main/tools/format/hash');
const { atLeastOneDefined, areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

/**
 *  Queries the database to update a user. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateUserForUserId(
  databaseConnection,
  userId,
  userNotificationToken,
  forUserConfigurationIsNotificationEnabled,
  forUserConfigurationIsLoudNotification,
  forUserConfigurationIsLogNotificationEnabled,
  forUserConfigurationIsReminderNotificationEnabled,
  forUserConfigurationInterfaceStyle,
  forUserConfigurationSnoozeLength,
  userConfigurationNotificationSound,
  userConfigurationLogsInterfaceScale,
  userConfigurationRemindersInterfaceScale,
  forUserConfigurationSilentModeIsEnabled,
  forUserConfigurationSilentModeStartUTCHour,
  forUserConfigurationSilentModeEndUTCHour,
  forUserConfigurationSilentModeStartUTCMinute,
  forUserConfigurationSilentModeEndUTCMinute,
) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  const userConfigurationIsNotificationEnabled = formatBoolean(forUserConfigurationIsNotificationEnabled);
  const userConfigurationIsLoudNotificationEnabled = formatBoolean(forUserConfigurationIsLoudNotification);
  const userConfigurationIsLogNotificationEnabled = formatBoolean(forUserConfigurationIsLogNotificationEnabled);
  const userConfigurationIsReminderNotificationEnabled = formatBoolean(forUserConfigurationIsReminderNotificationEnabled);
  const userConfigurationInterfaceStyle = formatNumber(forUserConfigurationInterfaceStyle);
  const userConfigurationSnoozeLength = formatNumber(forUserConfigurationSnoozeLength);
  // userConfigurationNotificationSound
  // userConfigurationLogsInterfaceScale
  // userConfigurationRemindersInterfaceScale
  const userConfigurationIsSilentModeEnabled = formatBoolean(forUserConfigurationSilentModeIsEnabled);
  const userConfigurationSilentModeStartUTCHour = formatNumber(forUserConfigurationSilentModeStartUTCHour);
  const userConfigurationSilentModeEndUTCHour = formatNumber(forUserConfigurationSilentModeEndUTCHour);
  const userConfigurationSilentModeStartUTCMinute = formatNumber(forUserConfigurationSilentModeStartUTCMinute);
  const userConfigurationSilentModeEndUTCMinute = formatNumber(forUserConfigurationSilentModeEndUTCMinute);

  // checks to see that all needed components are provided
  if (atLeastOneDefined(
    userNotificationToken,
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
    throw new ValidationError('No userNotificationToken, \
userConfigurationIsNotificationEnabled, \
userConfigurationIsLoudNotificationEnabled, \
userConfigurationIsLogNotificationEnabled, \
userConfigurationIsReminderNotificationEnabled, \
userConfigurationInterfaceStyle, \
userConfigurationSnoozeLength, \
userConfigurationNotificationSound, \
userConfigurationLogsInterfaceScale, \
userConfigurationRemindersInterfaceScale, \
userConfigurationIsSilentModeEnabled, \
userConfigurationSilentModeStartUTCHour, \
userConfigurationSilentModeEndUTCHour, \
userConfigurationSilentModeStartUTCMinute, \
or userConfigurationSilentModeEndUTCMinute, provided', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [];
  if (areAllDefined(userNotificationToken)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE users
      SET userNotificationToken = ?
      WHERE userId = ?`,
      [userNotificationToken, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsNotificationEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsNotificationEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsLoudNotificationEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsLoudNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsLoudNotificationEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsLogNotificationEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsLogNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsLogNotificationEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsReminderNotificationEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsReminderNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsReminderNotificationEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationInterfaceStyle)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationInterfaceStyle = ?
      WHERE userId = ?`,
      [userConfigurationInterfaceStyle, userId],
    ));
  }
  if (areAllDefined(userConfigurationSnoozeLength)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSnoozeLength = ?
      WHERE userId = ?`,
      [userConfigurationSnoozeLength, userId],
    ));
  }
  if (areAllDefined(userConfigurationNotificationSound)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationNotificationSound = ?
      WHERE userId = ?`,
      [userConfigurationNotificationSound, userId],
    ));
  }
  if (areAllDefined(userConfigurationLogsInterfaceScale)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationLogsInterfaceScale = ?
      WHERE userId = ?`,
      [userConfigurationLogsInterfaceScale, userId],
    ));
  }
  if (areAllDefined(userConfigurationRemindersInterfaceScale)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationRemindersInterfaceScale = ?
      WHERE userId = ?`,
      [userConfigurationRemindersInterfaceScale, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsSilentModeEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsSilentModeEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsSilentModeEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeStartUTCHour)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeStartUTCHour = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeStartUTCHour, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeEndUTCHour)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeEndUTCHour = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeEndUTCHour, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeStartUTCMinute)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeStartUTCMinute = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeStartUTCMinute, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeEndUTCMinute)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeEndUTCMinute = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeEndUTCMinute, userId],
    ));
  }

  await Promise.all(promises);
}

/**
 * When users first made accounts, we hashed their userIdentifier then stored it.
 * However, this is unnecessary and prevents us from knowning their true Apple userIdentifier
 * If we receive a userIdentifier that is unhashed, we update our records.
 */
async function updateUserForUserIdentifierHashedUserIdentifier(
  databaseConnection,
  forUnhashedUserIdentifier,
  forHashedUserIdentifier,
) {
  // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
  const unhashedUserIdentifier = formatString(forUnhashedUserIdentifier);
  const hashedUserIdentifier = formatSHA256Hash(forHashedUserIdentifier);

  if (areAllDefined(databaseConnection, unhashedUserIdentifier, hashedUserIdentifier) === false) {
    throw new ValidationError('databaseConnection, unhashedUserIdentifier, or hashedUserIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  if (hash(unhashedUserIdentifier) !== hashedUserIdentifier) {
    return;
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE users
    SET userIdentifier = ?
    WHERE userIdentifier = ?`,
    [unhashedUserIdentifier, hashedUserIdentifier],
  );
}

module.exports = { updateUserForUserId, updateUserForUserIdentifierHashedUserIdentifier };
