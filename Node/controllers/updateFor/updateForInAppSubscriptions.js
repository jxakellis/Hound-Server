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
  // TO DO NOW add invocation of this function inside of createTransactionsForUserIdFamilyIdEnvironmentReceipts
  // TO DO NOW add invocation of this function inside of createFamilyForUserId
   
  // Check if user is head of their current family

  // Check if the transaction table for transactions that: 1. transUserId = curUserId 2. transFamilyId != curFamilyId 3. expirationDate > new Date()

  // Update familyId of transactions found to the user's current familyId
}

module.exports = { updateInAppSubscriptionForUserIdFamilyIdTransactionInfo, reassignActiveInAppSubscriptionForUserIdFamilyId };
