import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { hash } from '../../main/format/hash.js';
import { type UserConfigurationRow } from '../../main/types/rows/UserConfigurationRow.js';

/**
 *  Queries the database to update a user. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateUserForUserId(
  databaseConnection: Queryable,
  userId: string,
  userConfiguration: Partial<UserConfigurationRow>,
  userNotificationToken?: string,
): Promise<void> {
  const {
    userConfigurationIsNotificationEnabled,
    userConfigurationIsLoudNotificationEnabled,
    userConfigurationIsLogNotificationEnabled,
    userConfigurationIsReminderNotificationEnabled,
    userConfigurationMeasurementSystem,
    userConfigurationInterfaceStyle,
    userConfigurationIsHapticsEnabled,
    userConfigurationUsesDeviceTimeZone,
    userConfigurationUserTimeZone,
    userConfigurationSnoozeLength,
    userConfigurationNotificationSound,
    userConfigurationIsSilentModeEnabled,
    userConfigurationSilentModeStartUTCHour,
    userConfigurationSilentModeEndUTCHour,
    userConfigurationSilentModeStartUTCMinute,
    userConfigurationSilentModeEndUTCMinute,
  } = userConfiguration;

  const promises = [];
  if (userNotificationToken !== undefined && userNotificationToken !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE users
      SET userNotificationToken = ?
      WHERE userId = ?`,
      [userNotificationToken, userId],
    ));
  }
  if (userConfigurationIsNotificationEnabled !== undefined && userConfigurationIsNotificationEnabled !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsNotificationEnabled, userId],
    ));
  }
  if (userConfigurationIsLoudNotificationEnabled !== undefined && userConfigurationIsLoudNotificationEnabled !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsLoudNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsLoudNotificationEnabled, userId],
    ));
  }
  if (userConfigurationIsLogNotificationEnabled !== undefined && userConfigurationIsLogNotificationEnabled !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsLogNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsLogNotificationEnabled, userId],
    ));
  }
  if (userConfigurationIsReminderNotificationEnabled !== undefined && userConfigurationIsReminderNotificationEnabled !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsReminderNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsReminderNotificationEnabled, userId],
    ));
  }
  if (userConfigurationMeasurementSystem !== undefined && userConfigurationMeasurementSystem !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationMeasurementSystem = ?
      WHERE userId = ?`,
      [userConfigurationMeasurementSystem, userId],
    ));
  }
  if (userConfigurationInterfaceStyle !== undefined && userConfigurationInterfaceStyle !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationInterfaceStyle = ?
      WHERE userId = ?`,
      [userConfigurationInterfaceStyle, userId],
    ));
  }
  if (userConfigurationIsHapticsEnabled !== undefined && userConfigurationIsHapticsEnabled !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsHapticsEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsHapticsEnabled, userId],
    ));
  }
  if (userConfigurationUsesDeviceTimeZone !== undefined && userConfigurationUsesDeviceTimeZone !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationUsesDeviceTimeZone = ?
      WHERE userId = ?`,
      [userConfigurationUsesDeviceTimeZone, userId],
    ));
  }
  if (userConfigurationUserTimeZone !== undefined && userConfigurationUserTimeZone !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationUserTimeZone = ?
      WHERE userId = ?`,
      [userConfigurationUserTimeZone, userId],
    ));
  }
  if (userConfigurationSnoozeLength !== undefined && userConfigurationSnoozeLength !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSnoozeLength = ?
      WHERE userId = ?`,
      [userConfigurationSnoozeLength, userId],
    ));
  }
  if (userConfigurationNotificationSound !== undefined && userConfigurationNotificationSound !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationNotificationSound = ?
      WHERE userId = ?`,
      [userConfigurationNotificationSound, userId],
    ));
  }
  if (userConfigurationIsSilentModeEnabled !== undefined && userConfigurationIsSilentModeEnabled !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsSilentModeEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsSilentModeEnabled, userId],
    ));
  }
  if (userConfigurationSilentModeStartUTCHour !== undefined && userConfigurationSilentModeStartUTCHour !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeStartUTCHour = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeStartUTCHour, userId],
    ));
  }
  if (userConfigurationSilentModeEndUTCHour !== undefined && userConfigurationSilentModeEndUTCHour !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeEndUTCHour = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeEndUTCHour, userId],
    ));
  }
  if (userConfigurationSilentModeStartUTCMinute !== undefined && userConfigurationSilentModeStartUTCMinute !== null) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeStartUTCMinute = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeStartUTCMinute, userId],
    ));
  }
  if (userConfigurationSilentModeEndUTCMinute !== undefined && userConfigurationSilentModeEndUTCMinute !== null) {
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
 * However, this is unnecessary and prevents us from knowing their true Apple userIdentifier
 * If we receive a userIdentifier that is unhashed, we update our records.
 */
async function updateUserForUserIdentifierHashedUserIdentifier(
  databaseConnection: Queryable,
  unhashedUserIdentifier: string,
  hashedUserIdentifier: string,
): Promise<void> {
  // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
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

export { updateUserForUserId, updateUserForUserIdentifierHashedUserIdentifier };
