const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatBoolean } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const { getFamilyHeadUserId } = require('./getForFamily');

// TODO FUTURE depreciate isAutoRenewing
// Omitted columns: originalTransactionId, userId, subscriptionGroupIdentifier, quantity, webOrderLineItemId, inAppOwnershipType
const transactionsColumns = `
transactionId, productId, purchaseDate,
expiresDate, expiresDate AS expirationDate,
numberOfFamilyMembers, numberOfDogs, autoRenewStatus, autoRenewStatus AS isAutoRenewing
autoRenewProductId, isRevoked, offerIdentifier
`;

/**
 *  If the query is successful, returns the most recent subscription for the userId's family (if no most recent subscription, fills in default subscription details).
 *  If a problem is encountered, creates and throws custom error
 */
async function getActiveTransaction(databaseConnection, familyMemberUserId) {
  if (areAllDefined(databaseConnection, familyMemberUserId) === false) {
    throw new ValidationError('databaseConnection or familyMemberUserId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, familyMemberUserId);

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
        WHERE isRevoked = 0 AND (TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), expiresDate) >= 0) AND userId = ?
    )
    SELECT ${transactionsColumns}
    FROM mostRecentlyPurchasedForEachProductId AS mrp
    WHERE mrp.rowNumberByProductId = 1
    ORDER BY mrp.productIdCorrespondingRank DESC
    LIMIT 1`,
    [familyHeadUserId],
  );

  // since we found no family subscription, assign the family to the default subscription
  if (areAllDefined(familySubscription) === false) {
    familySubscription = global.CONSTANT.SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === global.CONSTANT.SUBSCRIPTION.DEFAULT_SUBSCRIPTION_PRODUCT_ID);
  }

  familySubscription.isActive = true;
  familySubscription.autoRenewProductId = formatBoolean(familySubscription.autoRenewProductId) ?? familySubscription.productId;
  familySubscription.autoRenewStatus = formatBoolean(familySubscription.autoRenewStatus) ?? true;
  // TODO FUTURE depreciate isAutoRenewing
  familySubscription.isAutoRenewing = familySubscription.autoRenewStatus;
  familySubscription.isRevoked = formatBoolean(familySubscription.autoRenewStatus) ?? false;

  return familySubscription;
}

/**
 *  If the query is successful, returns the subscription history and active subscription for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllTransactions(databaseConnection, familyMemberUserId) {
  if (areAllDefined(databaseConnection, familyMemberUserId) === false) {
    throw new ValidationError('databaseConnection or familyMemberUserId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, familyMemberUserId);

  // find all of the family's subscriptions
  const transactionsHistory = await databaseQuery(
    databaseConnection,
    `SELECT ${transactionsColumns}
    FROM transactions t
    WHERE isRevoked = 0 AND userId = ?
    ORDER BY purchaseDate DESC, expiresDate DESC
    LIMIT 18446744073709551615`,
    [familyHeadUserId],
  );

  // Don't use .familyActiveSubscription property: Want to make sure this function always returns the most updated/accurate information
  const familyActiveSubscription = await getActiveTransaction(databaseConnection, familyMemberUserId);

  for (let i = 0; i < transactionsHistory.length; i += 1) {
    const subscription = transactionsHistory[i];
    subscription.isActive = subscription.transactionId === familyActiveSubscription.transactionId;
  }

  return transactionsHistory;
}

/**
 * Attempts to use the provided paramters to find an associated userId
 * 1. Attempts to find users record with same appAccountToken, returns userId if found
 * 2. Attempts to find transactions record with same originalTransactionId, returns userId if found
 * 3. Attempts to find transactions record with same transactionId, returns userId if found
 * 4. Returns null
 * @param {*} databaseConnection
 * @param {*} appAccountToken
 * @param {*} transactionId
 * @param {*} originalTransactionId
 * @returns
 */
async function getTransactionOwner(databaseConnection, appAccountToken, transactionId, originalTransactionId) {
  if (areAllDefined(databaseConnection) === false) {
    return null;
  }

  if (areAllDefined(appAccountToken) === true) {
    const [user] = await databaseQuery(
      databaseConnection,
      `SELECT userId 
      FROM users u
      WHERE u.userAppAccountToken = ?
      LIMIT 1`,
      [appAccountToken],
    );

    if (areAllDefined(user) === true) {
      return user.userId;
    }
  }

  // If the user supplied an originalTransactionId, search with this first to attempt to find the userId for the most recent associated transaction
  if (areAllDefined(originalTransactionId) === true) {
    // ALLOW TRANSACTIONS WITH isRevoked = 0 FOR MATCHING PURPOSES
    const [transaction] = await databaseQuery(
      databaseConnection,
      `SELECT userId
        FROM transactions t
        WHERE originalTransactionId = ?
        ORDER BY purchaseDate DESC
        LIMIT 1`,
      [originalTransactionId],
    );

    if (areAllDefined(transaction) === true) {
      return transaction.userId;
    }
  }

  // If the user supplied an transactionId, attempt to find the userId for the most recent associated transaction
  if (areAllDefined(transactionId) === true) {
    // ALLOW TRANSACTIONS WITH isRevoked = 0 FOR MATCHING PURPOSES
    const [transaction] = await databaseQuery(
      databaseConnection,
      `SELECT userId
        FROM transactions t
        WHERE transactionId = ?
        ORDER BY purchaseDate DESC
        LIMIT 1`,
      [transactionId],
    );

    if (areAllDefined(transaction) === true) {
      return transaction.userId;
    }
  }

  return null;
}

module.exports = {
  getActiveTransaction, getAllTransactions, getTransactionOwner,
};
