import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { getFamilyForUserId } from '../get/getFamily.js';

import { getActiveTransaction } from '../get/getTransactions.js';
import { deleteFamilyLeaveFamilyForUserIdFamilyId } from './deleteFamily.js';

/**
* Queries the database to delete a user. If the query is successful, then returns
*  If an error is encountered, creates and throws custom error
*/
async function deleteUserForUserId(databaseConnection: Queryable, userId: string): Promise<void> {
  // Deleting the user from our database is a multi-step process. We need to delete the user from the family first, then delete the user from the database
  // Otherwise, the family function will malfunction because the user is missing from users
  const family = await getFamilyForUserId(databaseConnection, userId);

  // The user is in a family, either attempt to delete the family or have the user leave the family
  if (family !== undefined && family !== null) {
    // Since the path for delete user doesn't have familyId attached (as it predicates the family path), no active subscription is attached
    const familyActiveSubscription = await getActiveTransaction(databaseConnection, userId);

    if (familyActiveSubscription === undefined || familyActiveSubscription === null) {
      throw new HoundError('familyActiveSubscription missing', deleteUserForUserId, ERROR_CODES.VALUE.MISSING);
    }

    // This step is reversible but sends a non-reversible notification at the end, so we save it for the very end so the notification is only sent if everything else is successful
    await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, userId, family.familyId, familyActiveSubscription);
  }

  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousUsers
    (
      userId,
      userIdentifier,
      userApplicationUsername,
      userEmail,
      userFirstName,
      userLastName,
      userNotificationToken,
      userAccountCreationDate,
      userLatestRequestDate,
      userAccountDeletionDate
      )
      SELECT 
      userId,
      userIdentifier,
      userAppAccountToken, 
      userEmail, 
      userFirstName, 
      userLastName, 
      userNotificationToken, 
      userAccountCreationDate, 
      CURRENT_TIMESTAMP(),
      CURRENT_TIMESTAMP()
      FROM users u
      WHERE userId = ?`,
    [userId],
  );

  await databaseQuery(
    databaseConnection,
    `DELETE uc
        FROM userConfiguration uc
        WHERE uc.userId = ?`,
    [userId],
  );

  // this must come second due to FK constraint
  await databaseQuery(
    databaseConnection,
    `DELETE u
        FROM users u
        WHERE u.userId = ?`,
    [userId],
  );
}

export { deleteUserForUserId };
