const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { formatSHA256Hash } = require('../../main/tools/format/formatObject');

const { getUserForUserId } = require('../getFor/getForUser');

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

  // Query the userId to find out if they are in a family
  const userInformation = await getUserForUserId(databaseConnection, userId);

  if (areAllDefined(userInformation) === false) {
    throw new ValidationError('No user found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.USER);
  }

  console.log('deleteUserForUserId', userInformation);

  const familyId = formatSHA256Hash(userInformation.familyId);

  // The user is in a family, either attempt to delete the family or have the user leave the family
  if (areAllDefined(familyId) === true) {
    // Since the path for delete user doesn't have familyId attached (as it predicates the family path), no active subscription is attached
    const familyActiveSubscription = await getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);

    await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, userId, familyId, familyActiveSubscription);
  }

  await databaseQuery(
    databaseConnection,
    'DELETE FROM users WHERE userId = ?',
    [userId],
  );

  // TO DO NOW TEST that this works properly
  // try with a user that is
  // 1. part of another family
  // 2. has their own family with other users
  // 3. has their own family with no other users
}

module.exports = { deleteUserForUserId };
