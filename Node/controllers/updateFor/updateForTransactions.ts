const { databaseQuery } from '../../main/tools/database/databaseQuery';
const {
  formatBoolean, formatString, formatNumber,
} = require('../../main/tools/format/formatObject';
const { areAllDefined, atLeastOneDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/tools/general/errors';

const { getFamilyHeadUserId } from '../getFor/getForFamily';

/**
 * Find the most recent transaction, with the most up-to-date autoRenewStatus, for a userId
 * If the transaction is the most recent, leave its autoRenewStatus alone
 * If the transaction isn't the most recent, then it cannot possibly be renewing.
 * Upgrades make new transactions (so new transaction is now renewing) and downgrades update existing transactions (so existing transaction is still renewing)
 * @param {*} databaseConnection
 * @param {*} userId
 */
async function disableOldTransactionsAutoRenewStatus(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  await databaseQuery(
    databaseConnection,
    `
    UPDATE transactions t
    JOIN (
      SELECT transactionId, autoRenewProductId, autoRenewStatus
      FROM transactions
      WHERE revocationReason IS NULL AND userId = ?
      ORDER BY purchaseDate DESC
      LIMIT 1
    ) mrt
    ON t.userId = ?
    SET t.autoRenewStatus =
      CASE
        WHEN t.transactionId = mrt.transactionId THEN mrt.autoRenewStatus
        ELSE 0
      END`,
    [userId, userId],
  );
}

async function updateSubscriptionAutoRenewal(databaseConnection, userId, transactionId, forAutoRenewStatus, forAutoRenewProductId) {
  if (areAllDefined(databaseConnection, userId, transactionId) === false) {
    throw new ValidationError('databaseConnection, userId, or transactionId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const autoRenewStatus = formatBoolean(forAutoRenewStatus);
  const autoRenewProductId = formatString(forAutoRenewProductId, 60);

  if (atLeastOneDefined(autoRenewStatus, autoRenewProductId) === false) {
    throw new ValidationError('autoRenewStatus or autoRenewProductId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  if (areAllDefined(autoRenewStatus)) {
    await databaseQuery(
      databaseConnection,
      `UPDATE transactions
      SET autoRenewStatus = ?
      WHERE transactionId = ?`,
      [autoRenewStatus, transactionId],
    );
  }
  if (areAllDefined(autoRenewProductId)) {
    await databaseQuery(
      databaseConnection,
      `UPDATE transactions 
      SET autoRenewProductId = ? 
      WHERE transactionId = ?`,
      [autoRenewProductId, transactionId],
    );
  }

  await disableOldTransactionsAutoRenewStatus(databaseConnection, userId);
}

async function updateSubscriptionRevocation(databaseConnection, userId, transactionId, forRevocationReason) {
  if (areAllDefined(databaseConnection, userId, transactionId) === false) {
    throw new ValidationError('databaseConnection, userId, or transactionId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // If revocation reason is defined, then that means the transaction was revoked
  // Otherwise, if revocationReason is null then leave revocationReason as null so it doesn't overwrite the pre existing revocationReason
  const revocationReason = formatNumber(forRevocationReason);

  if (areAllDefined(revocationReason) === false) {
    throw new ValidationError('revocationReason missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  /*
  Once a transaction is performed, certain values shouldn't be changed
  MUTABLE autoRenewStatus
  MUTABLE autoRenewProductId
  MUTABLE revocationReason
  IMMUTABLE other
  */

  await databaseQuery(
    databaseConnection,
    `UPDATE transactions
    SET revocationReason = ?
    WHERE transactionId = ?`,
    [revocationReason, transactionId],
  );
}

export { disableOldTransactionsAutoRenewStatus, updateSubscriptionAutoRenewal, updateSubscriptionRevocation };
