import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { hash } from '../../main/format/hash.js';
import { type PrivateCombinedUsersInformation } from '../../main/types/rows/CompositeRow.js';
import { userConfigurationColumns } from '../../main/types/rows/UserConfigurationRow.js';
import { type PublicUsersRow, privateUsersColumns, publicUsersColumns } from '../../main/types/rows/UsersRow.js';

import { updateUserForUserIdentifierHashedUserIdentifier } from '../update/updateUser.js';

/**
* If the query is successful, returns the user for the userIdentifier.
 *  If a problem is encountered, creates and throws custom error
 */
async function getPrivateCombinedUsersInformation(databaseConnection: Queryable, userIdentifier: string): Promise<PrivateCombinedUsersInformation | undefined> {
  // userIdentifier method of finding corresponding user(s)
  // have to specifically reference the columns, otherwise fm.userId will override u.userId.
  // Therefore setting userId to undefined (if there is no family member) even though the userId isn't undefined.
  const result1 = await databaseQuery<PrivateCombinedUsersInformation[]>(
    databaseConnection,
    `SELECT ${privateUsersColumns}, fm.familyId, ${userConfigurationColumns}
    FROM users u 
    JOIN userConfiguration uc ON u.userId = uc.userId
    LEFT JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userIdentifier = ?
    LIMIT 1`,
    [userIdentifier],
  );
  let userInformation = result1.safeIndex(0);

  const hashedUserIdentifier = hash(userIdentifier);
  if (userInformation === undefined || userInformation === null) {
    // If we can't find a user for a userIdentifier, hash that userIdentifier and then try again.
    // This is because we switched from hashing the Apple provided userIdentifier to directly storing it.
    // If query is successful, change saved userIdentifier and return result

    const result2 = await databaseQuery<PrivateCombinedUsersInformation[]>(
      databaseConnection,
      `SELECT ${privateUsersColumns}, fm.familyId, ${userConfigurationColumns}
      FROM users u
      JOIN userConfiguration uc ON u.userId = uc.userId 
      LEFT JOIN familyMembers fm ON u.userId = fm.userId
      WHERE u.userIdentifier = ?
      LIMIT 1`,
      [hashedUserIdentifier],
    );
    userInformation = result2.safeIndex(0);

    if (userInformation !== undefined && userInformation !== null) {
      await updateUserForUserIdentifierHashedUserIdentifier(
        databaseConnection,
        userIdentifier,
        hashedUserIdentifier,
      );
    }
  }

  // array has item(s), meaning there was a user found, successful!
  return userInformation;
}

async function getPublicUser(databaseConnection: Queryable, userId: string): Promise<PublicUsersRow | undefined> {
  const result = await databaseQuery<PublicUsersRow[]>(
    databaseConnection,
    `SELECT ${publicUsersColumns}
    FROM users u
    WHERE u.userId = ?
    LIMIT 1`,
    [userId],
  );

  return result.safeIndex(0);
}

export {
  getPrivateCombinedUsersInformation, getPublicUser,
};
