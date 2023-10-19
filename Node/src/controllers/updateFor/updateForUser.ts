import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { hash } from '../../main/format/hash.js';
import { type UserConfigurationRow } from '../../main/types/UserConfigurationRow.js';

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
  } = userConfiguration;

  const promises = [];
  if (userNotificationToken !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE users
      SET userNotificationToken = ?
      WHERE userId = ?`,
      [userNotificationToken, userId],
    ));
  }
  if (userConfigurationIsNotificationEnabled !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsNotificationEnabled, userId],
    ));
  }
  if (userConfigurationIsLoudNotificationEnabled !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsLoudNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsLoudNotificationEnabled, userId],
    ));
  }
  if (userConfigurationIsLogNotificationEnabled !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsLogNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsLogNotificationEnabled, userId],
    ));
  }
  if (userConfigurationIsReminderNotificationEnabled !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsReminderNotificationEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsReminderNotificationEnabled, userId],
    ));
  }
  if (userConfigurationInterfaceStyle !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationInterfaceStyle = ?
      WHERE userId = ?`,
      [userConfigurationInterfaceStyle, userId],
    ));
  }
  if (userConfigurationSnoozeLength !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSnoozeLength = ?
      WHERE userId = ?`,
      [userConfigurationSnoozeLength, userId],
    ));
  }
  if (userConfigurationNotificationSound !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationNotificationSound = ?
      WHERE userId = ?`,
      [userConfigurationNotificationSound, userId],
    ));
  }
  if (userConfigurationLogsInterfaceScale !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationLogsInterfaceScale = ?
      WHERE userId = ?`,
      [userConfigurationLogsInterfaceScale, userId],
    ));
  }
  if (userConfigurationRemindersInterfaceScale !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationRemindersInterfaceScale = ?
      WHERE userId = ?`,
      [userConfigurationRemindersInterfaceScale, userId],
    ));
  }
  if (userConfigurationIsSilentModeEnabled !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationIsSilentModeEnabled = ?
      WHERE userId = ?`,
      [userConfigurationIsSilentModeEnabled, userId],
    ));
  }
  if (userConfigurationSilentModeStartUTCHour !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeStartUTCHour = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeStartUTCHour, userId],
    ));
  }
  if (userConfigurationSilentModeEndUTCHour !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeEndUTCHour = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeEndUTCHour, userId],
    ));
  }
  if (userConfigurationSilentModeStartUTCMinute !== undefined) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE userConfiguration
      SET userConfigurationSilentModeStartUTCMinute = ?
      WHERE userId = ?`,
      [userConfigurationSilentModeStartUTCMinute, userId],
    ));
  }
  if (userConfigurationSilentModeEndUTCMinute !== undefined) {
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
