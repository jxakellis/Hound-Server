const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined, atLeastOneDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const { getFamilyHeadUserId } = require('../getFor/getForFamily');

async function updateSubscriptionAutoRenewal(databaseConnection, userId, familyId, transactionId, forAutoRenewStatus, forAutoRenewProductId) {
  if (areAllDefined(databaseConnection, transactionId, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, transactionId, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const isAutoRenewing = formatBoolean(forAutoRenewStatus);
  const autoRenewProductId = formatString(forAutoRenewProductId, 60);

  if (atLeastOneDefined(isAutoRenewing, autoRenewProductId) === false) {
    throw new ValidationError('isAutoRenewing or autoRenewProductId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

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
      WHERE userId = (
        SELECT userId 
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

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

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

module.exports = { updateSubscriptionAutoRenewal, updateSubscriptionRevocation };
