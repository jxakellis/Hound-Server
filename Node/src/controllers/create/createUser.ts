import crypto from 'crypto';

import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { hash } from '../../main/format/hash.js';

import { getPublicUser } from '../get/getUser.js';
import { type UserConfigurationRow } from '../../main/types/rows/UserConfigurationRow.js';
import { formatEmail, formatUnknownString, formatKnownString } from '../../main/format/formatObject.js';

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
  const existingUser = await getPublicUser(databaseConnection, userIdentifier) ?? await getPublicUser(databaseConnection, hash(userIdentifier));

  if (existingUser !== undefined && existingUser !== null) {
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
          userAccountCreationDate,
          userLatestRequestDate
          ) 
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            CURRENT_TIMESTAMP(),
            CURRENT_TIMESTAMP()
            )`,
      [
        userId,
        formatKnownString(userIdentifier, 64),
        crypto.randomUUID(),
        formatEmail(userEmail),
        formatUnknownString(userFirstName, 32),
        formatUnknownString(userLastName, 32),
        formatUnknownString(userNotificationToken, 256),
        // none, default value
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
                  ?,
                  ?,
                  ?
                  ) `,
      [
        userId,
        userConfiguration.userConfigurationIsNotificationEnabled,
        userConfiguration.userConfigurationIsLoudNotificationEnabled,
        userConfiguration.userConfigurationIsLogNotificationEnabled,
        userConfiguration.userConfigurationIsReminderNotificationEnabled,
        userConfiguration.userConfigurationMeasurementSystem,
        userConfiguration.userConfigurationInterfaceStyle,
        userConfiguration.userConfigurationIsHapticsEnabled,
        userConfiguration.userConfigurationUsesDeviceTimeZone,
        formatUnknownString(userConfiguration.userConfigurationUserTimeZone, 100),
        userConfiguration.userConfigurationSnoozeLength,
        userConfiguration.userConfigurationNotificationSound,
        userConfiguration.userConfigurationIsSilentModeEnabled,
        userConfiguration.userConfigurationSilentModeStartUTCHour,
        userConfiguration.userConfigurationSilentModeEndUTCHour,
        userConfiguration.userConfigurationSilentModeStartUTCMinute,
        userConfiguration.userConfigurationSilentModeEndUTCMinute,
      ],
    )];

  await Promise.all(promises);

  return userId;
}

export { createUserForUserIdentifier };
