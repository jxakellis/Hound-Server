const { ValidationError } = require('../../main/tools/general/errors');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatNumber, formatBoolean } = require('../../main/tools/format/formatObject');
const { atLeastOneDefined, areAllDefined } = require('../../main/tools/format/validateDefined');

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
    throw new ValidationError('databaseConnection or userId missing', global.constant.error.value.MISSING);
  }
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
  const userConfigurationSilentModeEndUTCMinute = formatNumber(forUserConfigurationSilentModeEndUTCMinute);

  // checks to see that all needed components are provided
  if (atLeastOneDefined(
    userNotificationToken,
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
    throw new ValidationError('No userNotificationToken, userConfigurationIsNotificationEnabled, userConfigurationIsLoudNotification, userConfigurationInterfaceStyle, userConfigurationSnoozeLength, userConfigurationNotificationSound, userConfigurationLogsInterfaceScale, userConfigurationRemindersInterfaceScale, userConfigurationSilentModeIsEnabled, userConfigurationSilentModeStartUTCHour, userConfigurationSilentModeEndUTCHour, userConfigurationSilentModeStartUTCMinute, or userConfigurationSilentModeEndUTCMinute, provided', global.constant.error.value.MISSING);
  }

  const promises = [];
  if (areAllDefined(userNotificationToken)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE users SET userNotificationToken = ? WHERE userId = ?',
      [userNotificationToken, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsNotificationEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationIsNotificationEnabled = ? WHERE userId = ?',
      [userConfigurationIsNotificationEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationIsLoudNotification)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationIsLoudNotification = ? WHERE userId = ?',
      [userConfigurationIsLoudNotification, userId],
    ));
  }
  if (areAllDefined(userConfigurationInterfaceStyle)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationInterfaceStyle = ? WHERE userId = ?',
      [userConfigurationInterfaceStyle, userId],
    ));
  }
  if (areAllDefined(userConfigurationSnoozeLength)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationSnoozeLength = ? WHERE userId = ?',
      [userConfigurationSnoozeLength, userId],
    ));
  }
  if (areAllDefined(userConfigurationNotificationSound)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationNotificationSound = ? WHERE userId = ?',
      [userConfigurationNotificationSound, userId],
    ));
  }
  if (areAllDefined(userConfigurationLogsInterfaceScale)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationLogsInterfaceScale = ? WHERE userId = ?',
      [userConfigurationLogsInterfaceScale, userId],
    ));
  }
  if (areAllDefined(userConfigurationRemindersInterfaceScale)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationRemindersInterfaceScale = ? WHERE userId = ?',
      [userConfigurationRemindersInterfaceScale, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeIsEnabled)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationSilentModeIsEnabled = ? WHERE userId = ?',
      [userConfigurationSilentModeIsEnabled, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeStartUTCHour)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationSilentModeStartUTCHour = ? WHERE userId = ?',
      [userConfigurationSilentModeStartUTCHour, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeEndUTCHour)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationSilentModeEndUTCHour = ? WHERE userId = ?',
      [userConfigurationSilentModeEndUTCHour, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeStartUTCMinute)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationSilentModeStartUTCMinute = ? WHERE userId = ?',
      [userConfigurationSilentModeStartUTCMinute, userId],
    ));
  }
  if (areAllDefined(userConfigurationSilentModeEndUTCMinute)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE userConfiguration SET userConfigurationSilentModeEndUTCMinute = ? WHERE userId = ?',
      [userConfigurationSilentModeEndUTCMinute, userId],
    ));
  }

  await Promise.all(promises);
}

module.exports = { updateUserForUserId };
