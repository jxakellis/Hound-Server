const { ValidationError } = require('../../main/tools/general/errors');
const { areAllDefined, atLeastOneDefined } = require('../../main/tools/format/validateDefined');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean,
} = require('../../main/tools/format/formatObject');
const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

async function updateInAppSubscriptionForUserIdFamilyIdTransactionInfo(databaseConnection, transactionId, userId, familyId, autoRenewStatus, revocationReason) {
  console.log('updateInAppSubscriptionForUserIdFamilyIdTransactionInfo');
  console.log(autoRenewStatus);
  console.log(revocationReason);
  if (areAllDefined(databaseConnection, transactionId, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, transactionId, userId, or familyId missing', global.constant.error.value.MISSING);
  }

  const isAutoRenewing = formatBoolean(autoRenewStatus);
  // If revocation reason is defined, then that means the transaction was revoked
  // Otherwise, if revocationReason is undefined then leave isRevoked as undefined so it doesn't overwrite the pre existing isRevoked
  const isRevoked = areAllDefined(revocationReason) ? true : undefined;

  if (atLeastOneDefined(isAutoRenewing, isRevoked) === false) {
    throw new ValidationError('isAutoRenewing or isRevoked missing', global.constant.error.value.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.constant.error.family.permission.INVALID);
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

  console.log(isAutoRenewing);
  console.log(isRevoked);

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

module.exports = { updateInAppSubscriptionForUserIdFamilyIdTransactionInfo };
