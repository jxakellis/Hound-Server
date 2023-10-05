const { ValidationError } from '../../main/server/globalErrors';
const { databaseQuery } from '../../main/database/databaseQuery';
const { areAllDefined } from '../../main/tools/validate/validateDefined';

const { getFamilyId } from '../getFor/getForFamily';

const { getActiveTransaction } from '../getFor/getForTransactions';
const { deleteFamilyLeaveFamilyForUserIdFamilyId } from './deleteForFamily';

/**
* Queries the database to delete a user. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
*/
async function deleteUserForUserId(databaseConnection, userId) {
  // familyKickUserId is optional at this point
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Deleting the user from our database is a multi-step process. We need to delete the user from the family first, then delete the user from the database
  // Otherwise, the family function will malfunction because the user is missing from users
  const familyId = await getFamilyId(databaseConnection, userId);

  // The user is in a family, either attempt to delete the family or have the user leave the family
  if (areAllDefined(familyId) === true) {
    // Since the path for delete user doesn't have familyId attached (as it predicates the family path), no active subscription is attached
    const familyActiveSubscription = await getActiveTransaction(databaseConnection, userId);

    // This step is reversible but sends a non-reversible notification at the end, so we save it for the very end so the notif is only sent if everything else is successful
    await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, userId, familyId, familyActiveSubscription);
  }

  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousUsers
    (userId, userIdentifier, userAppAccountToken, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate, userAccountDeletionDate)
    SELECT userId, userIdentifier, userAppAccountToken, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate, CURRENT_TIMESTAMP()
    FROM users u
    WHERE userId = ?`,
    [userId],
  );

  const promises = [
    databaseQuery(
      databaseConnection,
      `DELETE FROM users
      WHERE userId = ?`,
      [userId],
    ),
    databaseQuery(
      databaseConnection,
      `DELETE FROM userConfiguration
      WHERE userId = ?`,
      [userId],
    ),
  ];

  await Promise.all(promises);
}

export { deleteUserForUserId };