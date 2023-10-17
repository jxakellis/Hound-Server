import { databaseConnectionForGeneral } from '../../../database/createDatabaseConnections';
import { databaseQuery } from '../../../database/databaseQuery';
import { UserConfigurationWithPartialPrivateUsers } from '../../../types/CompositeRow';
import { userConfigurationColumns } from '../../../types/UserConfigurationRow';

/**
 *  Takes a userId
 *  Returns the userNotificationToken and (optionally) userConfigurationNotificationSound of the user if they have a defined userNotificationToken and are notificationEnabled
 *  If an error is encountered, creates and throws custom error
 */
async function getUserToken(userId: string): Promise<UserConfigurationWithPartialPrivateUsers | undefined> {
  // retrieve userNotificationToken, userConfigurationNotificationSound, and isLoudNotificaiton of a user with the userId, non-null userNotificationToken, and userConfigurationIsNotificationEnabled
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    databaseConnectionForGeneral,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    WHERE u.userId = ? AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 1`,
    [userId],
  );

  return result.safeIndex(0);
}

/**
 *  Takes a familyId
 *  Returns the userNotificationToken of users that are in the family, have a defined userNotificationToken, and are notificationEnabled
 * If an error is encountered, creates and throws custom error
 */
async function getAllFamilyMemberTokens(familyId: string): Promise<UserConfigurationWithPartialPrivateUsers[]> {
  // retrieve userNotificationToken that fit the criteria
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    databaseConnectionForGeneral,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    JOIN familyMembers fm ON u.userId = fm.userId
    WHERE fm.familyId = ? AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 18446744073709551615`,
    [familyId],
  );

  return result;
}

/**
 *  Takes a userId and familyId
 *  Returns the userNotificationToken of users that aren't the userId, are in the family, have a defined userNotificationToken, and are notificationEnabled
 * If an error is encountered, creates and throws custom error
 */
async function getOtherFamilyMemberTokens(userId: string, familyId: string): Promise<UserConfigurationWithPartialPrivateUsers[]> {
  // retrieve userNotificationToken that fit the criteria
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    databaseConnectionForGeneral,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userId != ? AND fm.familyId = ? AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 18446744073709551615`,
    [userId, familyId],
  );

  return result;
}

export { getUserToken, getAllFamilyMemberTokens, getOtherFamilyMemberTokens };
