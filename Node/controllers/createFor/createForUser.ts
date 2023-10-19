import crypto from 'crypto';

import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { hash } from '../../main/format/hash';

import { getPublicUser } from '../getFor/getForUser';
import { UserConfigurationRow } from '../../main/types/UserConfigurationRow';
import { formatEmail, formatUnknownString } from '../../main/format/formatObject';

/**
 *  Queries the database to create a user. If the query is successful, then returns the userId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createUserForUserIdentifier(
  databaseConnection: Queryable,
  userIdentifier: string,
  userConfiguration: UserConfigurationRow,
  userEmail?: string,
  userFirstName?: string,
  userLastName?: string,
  userNotificationToken?: string,
): Promise<string> {
  const existingUser = await getPublicUser(databaseConnection, userIdentifier);

  if (existingUser !== undefined) {
    return existingUser.userId;
  }

  const userId = hash(userIdentifier);

  const promises = [
    databaseQuery(
      databaseConnection,
      `INSERT INTO users
      (
        userId,
        userIdentifier,
        userAppAccountToken,
        userEmail,
        userFirstName,
        userLastName,
        userNotificationToken,
        userAccountCreationDate
      ) 
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        CURRENT_TIMESTAMP()
      )`,
      [
        userId,
        userIdentifier,
        crypto.randomUUID(),
        formatEmail(userEmail),
        formatUnknownString(userFirstName, 32),
        formatUnknownString(userLastName, 32),
        formatUnknownString(userNotificationToken, 100),
        // none, default value
      ],
    ),
    databaseQuery(
      databaseConnection,
      `INSERT INTO userConfiguration
      (
        userId,
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
      ) 
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      ) `,
      [
        userId,
        userConfiguration.userConfigurationIsNotificationEnabled, // ?? 0,
        userConfiguration.userConfigurationIsLoudNotificationEnabled, // ?? 0,
        userConfiguration.userConfigurationIsLogNotificationEnabled, // ?? 0,
        userConfiguration.userConfigurationIsReminderNotificationEnabled, // ?? 0,
        userConfiguration.userConfigurationInterfaceStyle, // ?? 0,
        userConfiguration.userConfigurationSnoozeLength, // ?? 300,
        userConfiguration.userConfigurationNotificationSound, // ?? 'Radar',
        userConfiguration.userConfigurationLogsInterfaceScale, // ?? 'Medium',
        userConfiguration.userConfigurationRemindersInterfaceScale, // ?? 'Medium',
        userConfiguration.userConfigurationIsSilentModeEnabled, // ?? false,
        userConfiguration.userConfigurationSilentModeStartUTCHour, // ?? 7,
        userConfiguration.userConfigurationSilentModeEndUTCHour, // ?? 19,
        userConfiguration.userConfigurationSilentModeStartUTCMinute, // ?? 0,
        userConfiguration.userConfigurationSilentModeEndUTCMinute, // ?? 0,
      ],
    )];

  await Promise.all(promises);

  return userId;
}

export { createUserForUserIdentifier };
