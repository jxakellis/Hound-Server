const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatNumber, formatBoolean } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

// Omitted columns: originalTransactionId, userId, familyId, subscriptionGroupIdentifier, quantity, webOrderLineItemId, inAppOwnershipType
const transactionsColumns = 'transactionId, productId, purchaseDate, expirationDate, numberOfFamilyMembers, numberOfDogs, isAutoRenewing, isRevoked, offerCode';

/**
 *  If the query is successful, returns the most recent subscription for the familyId (if no most recent subscription, fills in default subscription details).
 *  If a problem is encountered, creates and throws custom error
 */
async function getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId) {
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // find the family's most recent subscription
  let [familySubscription] = await databaseQuery(
    databaseConnection,
    // For mrp, we only select transactions that aren't expired, then
    // For mrp, for each productId, we give a rowNumber of 1 to the row that has the greatest (most recent) purchaseDate, then
    // For mrp, for each transaction, we then rank their productId's by level of importance. If importanceA > importanceB, then A is a upgrade and take priority.
    `WITH mostRecentlyPurchasedForEachProductId AS (
        SELECT 
            *,
            ROW_NUMBER() OVER (PARTITION BY productId ORDER BY purchaseDate DESC) AS rowNumberByProductId,
            CASE 
                WHEN productId = 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly' THEN 1
                WHEN productId = 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly' THEN 2
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly' THEN 3
                WHEN productId = 'com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly' THEN 4
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymembers.onemonth' THEN 5
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymembers.sixmonth' THEN 6
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymembers.oneyear' THEN 7
                ELSE 0
            END AS productIdCorrespondingRank
        FROM transactions t
        WHERE familyId = ? AND (TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP(), expirationDate) >= 0)
    )
    SELECT ${transactionsColumns}
    FROM mostRecentlyPurchasedForEachProductId AS mrp
    WHERE mrp.rowNumberByProductId = 1
    ORDER BY mrp.productIdCorrespondingRank DESC
    LIMIT 1`,
    [familyId],
  );

  // since we found no family subscription, assign the family to the default subscription
  if (areAllDefined(familySubscription) === false) {
    familySubscription = global.CONSTANT.SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === global.CONSTANT.SUBSCRIPTION.DEFAULT_SUBSCRIPTION_PRODUCT_ID);
  }

  familySubscription.isActive = true;
  familySubscription.isAutoRenewing = formatBoolean(familySubscription.isAutoRenewing) ?? true;
  familySubscription.isRevoked = formatBoolean(familySubscription.isRevoked) ?? false;

  console.log('\nACTIVE SUBSCRIPTION', familySubscription, '\n');
  return familySubscription;
}

/**
 *  If the query is successful, returns the subscription history and active subscription for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllInAppSubscriptionsForFamilyId(databaseConnection, familyId) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // find all of the family's subscriptions
  const transactionsHistory = await databaseQuery(
    databaseConnection,
    `SELECT ${transactionsColumns}
    FROM transactions t
    WHERE familyId = ? ORDER BY purchaseDate DESC, expirationDate DESC
    LIMIT 18446744073709551615`,
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
    throw new ValidationError('databaseConnection or transactionId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const [result] = await databaseQuery(
    databaseConnection,
    `SELECT ${transactionsColumns}
    FROM transactions t
    WHERE transactionId = ?
    LIMIT 1`,
    [transactionId],
  );

  return result;
}

module.exports = {
  getActiveInAppSubscriptionForFamilyId, getAllInAppSubscriptionsForFamilyId, getInAppSubscriptionForTransactionId,
};
