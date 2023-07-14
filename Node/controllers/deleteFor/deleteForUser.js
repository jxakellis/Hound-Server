const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { getFamilyIdForUserId } = require('../getFor/getForFamily');

const { getActiveInAppSubscriptionForFamilyId } = require('../getFor/getForInAppSubscriptions');
const { deleteFamilyLeaveFamilyForUserIdFamilyId } = require('./deleteForFamily');

/**
* Queries the database to delete a user. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
*/
async function deleteUserForUserId(databaseConnection, userId) {
  // familyKickUserId is optional at this point
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // We first delete the user from the database first, as this is easily reversible
  // keep record of user being deleted, do this first so the delete statement doesn't mess with this query
  // TO DO NOW TEST that this record is saved properly
  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousUsers
    (userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate, userAccountDeletionDate)
    SELECT userId, userIdentifier, userApplicationUsername, userEmail, userFirstName, userLastName, userNotificationToken, userAccountCreationDate, ?
    FROM users u
    WHERE userId = ?`,
    [new Date(), userId],
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

  const familyId = await getFamilyIdForUserId(databaseConnection, userId);

  // The user is in a family, either attempt to delete the family or have the user leave the family
  if (areAllDefined(familyId) === true) {
    // Since the path for delete user doesn't have familyId attached (as it predicates the family path), no active subscription is attached
    const familyActiveSubscription = await getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);

    // This step is reversible but sends a non-reversible notification at the end, so we save it for the very end so the notif is only sent if everything else is successful
    await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, userId, familyId, familyActiveSubscription);
  }
}

module.exports = { deleteUserForUserId };
