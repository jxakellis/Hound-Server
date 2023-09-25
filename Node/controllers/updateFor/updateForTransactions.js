const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined, atLeastOneDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

async function updateSubscriptionAutoRenewal(databaseConnection, userId, familyId, transactionId, forAutoRenewStatus, forAutoRenewProductId) {
  if (areAllDefined(databaseConnection, transactionId, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, transactionId, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const isAutoRenewing = formatBoolean(forAutoRenewStatus);
  const autoRenewProductId = formatString(forAutoRenewProductId, 60);

  if (atLeastOneDefined(isAutoRenewing, autoRenewProductId) === false) {
    throw new ValidationError('isAutoRenewing or autoRenewProductId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  /*
  Once a transaction is performed, certain values shouldn't be changed
  MUTABLE isAutoRenewing
  MUTABLE autoRenewProductId
  MUTABLE isRevoked
  IMMUTABLE other
  */

  const promises = [];

  if (areAllDefined(isAutoRenewing)) {
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE transactions
      SET isAutoRenewing = ?
      WHERE transactionId = ?`,
      [isAutoRenewing, transactionId],
    ));
  }
  if (areAllDefined(autoRenewProductId)) {
    // Find all other non-expired transactions for a family. Set all their autoRenewProductId to the value found here.
    promises.push(databaseQuery(
      databaseConnection,
      `UPDATE transactions 
      SET autoRenewProductId = ? 
      WHERE familyId = (
        SELECT familyId 
        FROM transactions 
        WHERE transactionId = ?
        AND TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), expirationDate) >= 0
      )`,
      [autoRenewProductId, transactionId],
    ));
  }

  await Promise.all(promises);
}

async function updateSubscriptionRevocation(databaseConnection, userId, familyId, transactionId, forRevocationReason) {
  if (areAllDefined(databaseConnection, transactionId, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, transactionId, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // If revocation reason is defined, then that means the transaction was revoked
  // Otherwise, if revocationReason is null then leave isRevoked as null so it doesn't overwrite the pre existing isRevoked
  const isRevoked = areAllDefined(forRevocationReason) ? true : null;

  if (areAllDefined(isRevoked) === false) {
    throw new ValidationError('isRevoked missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  /*
  Once a transaction is performed, certain values shouldn't be changed
  MUTABLE isAutoRenewing
  MUTABLE autoRenewProductId
  MUTABLE isRevoked
  IMMUTABLE other
  */

  await databaseQuery(
    databaseConnection,
    `UPDATE transactions
    SET isRevoked = ?
    WHERE transactionId = ?`,
    [isRevoked, transactionId],
  );
}

/**
 * Attempts to reassign any active subscriptions a user has purchased in a previous family to their current family
 * The user must be the head of their current family, the subscription must not have expired, and the subscription must be assigned to that user but under a different family
 * If these conditions are met, then update the familyId of the transaction to the user's current family
 */
async function reassignActiveSubscriptionsToNewFamilyForUserIdFamilyId(databaseConnection, forUserId, forNewFamilyId) {
  // TODO NOW remove the familyId column from transactions. Instead, at query time we link the userId to the familyId from the families table.
  // TODO NOW we are going to add logic to allow a family to switch its family head, therefore, verify this function will reassign all transactions correctly to the new family
  if (areAllDefined(databaseConnection, forUserId, forUserId) === false) {
    throw new ValidationError('databaseConnection, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const newFamilyFamilyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, forNewFamilyId);

  // Only a user that is the head of their family can have subscriptions reassigned
  if (newFamilyFamilyHeadUserId !== forUserId) {
    // Reassigning subscriptions is optional. It is acceptable if this check fails.
    return;
  }

  // Reassign all non-expired, non-revoked transactions by the user to their current family.
  await databaseQuery(
    databaseConnection,
    `UPDATE transactions
    SET familyId = ?
    WHERE userId = ? AND isRevoked = 0 AND TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), expirationDate) >= 0`,
    [forNewFamilyId, forUserId],
  );
}

module.exports = { updateSubscriptionAutoRenewal, updateSubscriptionRevocation, reassignActiveSubscriptionsToNewFamilyForUserIdFamilyId };
