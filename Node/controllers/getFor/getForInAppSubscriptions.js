const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { formatNumber, formatBoolean } = require('../../main/tools/format/formatObject');

// Omitted columns: originalTransactionId, userId, familyId, subscriptionGroupIdentifier, quantity, webOrderLineItemId, inAppOwnershipType
const transactionsColumns = 'transactionId, productId, purchaseDate, expirationDate, numberOfFamilyMembers, numberOfDogs, isAutoRenewing, isRevoked';

/**
 *  If the query is successful, returns the most recent subscription for the familyId (if no most recent subscription, fills in default subscription details).
 *  If a problem is encountered, creates and throws custom error
 */
async function getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId) {
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.constant.error.value.MISSING);
  }

  // find the family's most recent subscription

  const currentDate = new Date();

  let familySubscription = await databaseQuery(
    databaseConnection,
    `SELECT ${transactionsColumns} FROM transactions WHERE familyId = ? AND expirationDate >= ? AND isRevoked = 0 ORDER BY expirationDate DESC, purchaseDate DESC, transactionId DESC LIMIT 1`,
    [familyId, currentDate],
  );

  // since we found no family subscription, assign the family to the default subscription
  if (familySubscription.length === 0) {
    familySubscription = global.constant.subscription.SUBSCRIPTIONS.find((subscription) => subscription.productId === global.constant.subscription.DEFAULT_SUBSCRIPTION_PRODUCT_ID);
    familySubscription.userId = undefined;
    familySubscription.purchaseDate = undefined;
    familySubscription.expirationDate = undefined;
    familySubscription.isAutoRenewing = true;
    familySubscription.isRevoked = false;
  }
  else {
    // we found a subscription, so get rid of the one entry array
    [familySubscription] = familySubscription;
  }

  familySubscription.isActive = true;
  familySubscription.isAutoRenewing = formatBoolean(familySubscription.isAutoRenewing);
  familySubscription.isRevoked = formatBoolean(familySubscription.isRevoked);

  return familySubscription;
}

/**
 *  If the query is successful, returns the subscription history and active subscription for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllInAppSubscriptionsForFamilyId(databaseConnection, familyId) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.constant.error.value.MISSING);
  }

  // find all of the family's subscriptions
  const transactionsHistory = await databaseQuery(
    databaseConnection,
    `SELECT ${transactionsColumns} FROM transactions WHERE familyId = ? ORDER BY expirationDate DESC, purchaseDate DESC LIMIT 18446744073709551615`,
    [familyId],
  );

  // Don't use .familyActiveSubscription property: Want to make sure this function always returns the most updated/accurate information
  const familyActiveSubscription = await getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);

  for (let i = 0; i < transactionsHistory.length; i += 1) {
    const subscription = transactionsHistory[i];
    subscription.isActive = subscription.transactionId === familyActiveSubscription.transactionId;
  }

  return transactionsHistory;
}

/**
 *  If the query is successful, returns the transaction for the transactionId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getInAppSubscriptionForTransactionId(databaseConnection, forTransactionId) {
  const transactionId = formatNumber(forTransactionId);
  if (areAllDefined(databaseConnection, transactionId) === false) {
    throw new ValidationError('databaseConnection or transactionId missing', global.constant.error.value.MISSING);
  }

  let transactionsHistory = await databaseQuery(
    databaseConnection,
    `SELECT ${transactionsColumns} FROM transactions WHERE transactionId = ? LIMIT 1`,
    [transactionId],
  );
  [transactionsHistory] = transactionsHistory;

  return transactionsHistory;
}

module.exports = {
  getActiveInAppSubscriptionForFamilyId, getAllInAppSubscriptionsForFamilyId, getInAppSubscriptionForTransactionId,
};
