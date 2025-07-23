import { DatabasePools, getPoolConnection } from '../../../database/databaseConnections.js';
import { databaseQuery } from '../../../database/databaseQuery.js';
import { type UserConfigurationWithPartialPrivateUsers } from '../../../types/rows/CompositeRow.js';
import { userConfigurationColumns } from '../../../types/rows/UserConfigurationRow.js';

/**
 *  Takes a userId
 *  Returns the userNotificationToken and (optionally) userConfigurationNotificationSound of the user if they have a defined userNotificationToken and are notificationEnabled
 *  If an error is encountered, creates and throws custom error
 */
async function getUserToken(userId: string): Promise<UserConfigurationWithPartialPrivateUsers | undefined> {
  // This pool connection is obtained manually here. Therefore we must also release it manually.
  // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
  const generalPoolConnection = await getPoolConnection(DatabasePools.general);

  // retrieve userNotificationToken, userConfigurationNotificationSound, and isLoudNotification of a user with the userId, non-null userNotificationToken, and userConfigurationIsNotificationEnabled
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    generalPoolConnection,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    WHERE u.userId = ? AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 1`,
    [userId],
  ).finally(() => {
    generalPoolConnection.release();
  });

  return result.safeIndex(0);
}

/**
 *  Takes a familyId
 *  Returns the userNotificationToken of users that are in the family, have a defined userNotificationToken, and are notificationEnabled
 * If an error is encountered, creates and throws custom error
 */
async function getAllFamilyMemberTokens(familyId: string): Promise<UserConfigurationWithPartialPrivateUsers[]> {
  // This pool connection is obtained manually here. Therefore we must also release it manually.
  // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
  const generalPoolConnection = await getPoolConnection(DatabasePools.general);

  // retrieve userNotificationToken that fit the criteria
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    generalPoolConnection,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    JOIN familyMembers fm ON u.userId = fm.userId
    WHERE fm.familyId = ? AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 18446744073709551615`,
    [familyId],
  ).finally(() => {
    generalPoolConnection.release();
  });

  return result;
}

/**
 *  Takes a userId and familyId
 *  Returns the userNotificationToken of users that aren't the userId, are in the family, have a defined userNotificationToken, and are notificationEnabled
 * If an error is encountered, creates and throws custom error
 */
async function getOtherFamilyMemberTokens(userId: string, familyId: string): Promise<UserConfigurationWithPartialPrivateUsers[]> {
  // This pool connection is obtained manually here. Therefore we must also release it manually.
  // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
  const generalPoolConnection = await getPoolConnection(DatabasePools.general);

  // retrieve userNotificationToken that fit the criteria
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    generalPoolConnection,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userId != ? AND fm.familyId = ? AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 18446744073709551615`,
    [userId, familyId],
  ).finally(() => {
    generalPoolConnection.release();
  });

  return result;
}

async function getFamilyMemberTokensForUserIds(familyId: string, userIds: string[]): Promise<UserConfigurationWithPartialPrivateUsers[]> {
  const generalPoolConnection = await getPoolConnection(DatabasePools.general);
  const result = await databaseQuery<UserConfigurationWithPartialPrivateUsers[]>(
    generalPoolConnection,
    `SELECT u.userNotificationToken, ${userConfigurationColumns}
    FROM users u
    JOIN userConfiguration uc ON u.userId = uc.userId
    JOIN familyMembers fm ON u.userId = fm.userId
    WHERE fm.familyId = ? AND u.userId IN (?) AND u.userNotificationToken IS NOT NULL AND uc.userConfigurationIsNotificationEnabled = 1
    LIMIT 18446744073709551615`,
    [familyId, userIds],
  ).finally(() => {
    generalPoolConnection.release();
  });

  return result;
}

export {
  getUserToken, getAllFamilyMemberTokens, getOtherFamilyMemberTokens, getFamilyMemberTokensForUserIds,
};
