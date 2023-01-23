const { ValidationError } = require('../../main/tools/general/errors');
const { areAllDefined, atLeastOneDefined } = require('../../main/tools/format/validateDefined');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean,
} = require('../../main/tools/format/formatObject');
const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

async function updateInAppSubscriptionForUserIdFamilyIdTransactionInfo(databaseConnection, transactionId, userId, familyId, autoRenewStatus, revocationReason) {
  if (areAllDefined(databaseConnection, transactionId, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, transactionId, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const isAutoRenewing = formatBoolean(autoRenewStatus);
  // If revocation reason is defined, then that means the transaction was revoked
  // Otherwise, if revocationReason is undefined then leave isRevoked as undefined so it doesn't overwrite the pre existing isRevoked
  const isRevoked = areAllDefined(revocationReason) ? true : undefined;

  if (atLeastOneDefined(isAutoRenewing, isRevoked) === false) {
    throw new ValidationError('isAutoRenewing or isRevoked missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  /*
  Once a transaction is performed, certain values shouldn't be changed
  IMMUTABLE transactionId
  IMMUTABLE originalTransactionId
  IMMUTABLE userId
  IMMUTABLE familyId
  IMMUTABLE productId
  IMMUTABLE subscriptionGroupIdentifier
  IMMUTABLE purchaseDate
  IMMUTABLE expirationDate
  IMMUTABLE numberOfFamilyMembers
  IMMUTABLE numberOfDogs
  IMMUTABLE quantity
  IMMUTABLE webOrderLineItemId
  IMMUTABLE inAppOwnershipType
  MUTABLE isAutoRenewing
  MUTABLE isRevoked
  */

  const promises = [];

  if (areAllDefined(isAutoRenewing)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE transactions SET isAutoRenewing = ? WHERE transactionId = ?',
      [isAutoRenewing, transactionId],
    ));
  }
  if (areAllDefined(isRevoked)) {
    promises.push(databaseQuery(
      databaseConnection,
      'UPDATE transactions SET isRevoked = ? WHERE transactionId = ?',
      [isRevoked, transactionId],
    ));
  }

  await Promise.all(promises);
}

/**
 * Attempts to reassign any active subscriptions a user has purchased in a previous family to their current family
 * The user must be the head of their current family, the subscription must not have expired, and the subscription must be assigned to that user but under a different family
 * If these conditions are met, then update the familyId of the transaction to the user's current family
 */
async function reassignActiveInAppSubscriptionForUserIdFamilyId(databaseConnection, userId, familyId) {
  // TO DO NOW test that subscription reassignment works
  if (areAllDefined(databaseConnection, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Only family heads have their userId in the families table
  // A result from this indicates the userId and familyId combo reference a family head
  const [family] = await databaseQuery(
    databaseConnection,
    'SELECT 1 FROM families WHERE userId = ? AND familyId = ? LIMIT 1',
    [userId, familyId],
  );

  // Only a user that is the head of their family can have subscriptions reassigned
  if (areAllDefined(family) === false) {
    return;
  }

  // Reassign all non-expired, non-revoked transactions by the user to their current family.
  await databaseQuery(
    databaseConnection,
    'UPDATE transactions SET familyId = ? WHERE userId = ? AND expirationDate >= ? AND isRevoked = 0',
    [familyId, userId, new Date()],
  );
}

module.exports = { updateInAppSubscriptionForUserIdFamilyIdTransactionInfo, reassignActiveInAppSubscriptionForUserIdFamilyId };
