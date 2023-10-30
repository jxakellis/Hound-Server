import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { SUBSCRIPTION } from '../../main/server/globalConstants.js';
import { type TransactionsRow, transactionsColumns } from '../../main/types/TransactionsRow.js';
import { type PublicUsersRow, publicUsersColumns } from '../../main/types/UsersRow.js';

import { getFamilyHeadUserId } from './getForFamily.js';

/**
 *  If the query is successful, returns the most recent subscription for the userId's family (if no most recent subscription, fills in default subscription details).
 *  If a problem is encountered, creates and throws custom error
 */
async function getActiveTransaction(databaseConnection: Queryable, familyMemberUserId: string): Promise<TransactionsRow | undefined> {
  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, familyMemberUserId);

  if (familyHeadUserId === undefined || familyHeadUserId === null) {
    return undefined;
  }

  // find the family's most recent subscription
  const familySubscriptionResult = await databaseQuery<TransactionsRow[]>(
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
        WHERE revocationReason IS NULL AND (TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), expiresDate) >= 0) AND userId = ?
    )
    SELECT ${transactionsColumns}
    FROM mostRecentlyPurchasedForEachProductId AS t
    WHERE t.rowNumberByProductId = 1
    ORDER BY t.productIdCorrespondingRank DESC
    LIMIT 1`,
    [familyHeadUserId],
  );

  const familySubscription = familySubscriptionResult.safeIndex(0) ?? SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === SUBSCRIPTION.DEFAULT_SUBSCRIPTION_PRODUCT_ID);

  // since we found no family subscription, assign the family to the default subscription
  if (familySubscription === undefined || familySubscription === null) {
    return undefined;
  }

  familySubscription.isActive = 1;

  return familySubscription;
}

/**
 *  If the query is successful, returns the subscription history and active subscription for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllTransactions(databaseConnection: Queryable, familyMemberUserId: string): Promise<TransactionsRow[] | undefined> {
  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, familyMemberUserId);

  if (familyHeadUserId === undefined || familyHeadUserId === null) {
    return undefined;
  }

  // find all of the family's subscriptions
  const transactionsHistory = await databaseQuery<TransactionsRow[]>(
    databaseConnection,
    `SELECT ${transactionsColumns}
    FROM transactions t
    WHERE revocationReason IS NULL AND userId = ?
    ORDER BY purchaseDate DESC, expiresDate DESC
    LIMIT 18446744073709551615`,
    [familyHeadUserId],
  );

  // Don't use .familyActiveSubscription property: Want to make sure this function always returns the most updated/accurate information
  const familyActiveSubscription = await getActiveTransaction(databaseConnection, familyMemberUserId);

  if (familyActiveSubscription !== undefined && familyActiveSubscription !== null) {
    for (let i = 0; i < transactionsHistory.length; i += 1) {
      const subscription = transactionsHistory[i];
      subscription.isActive = (subscription.transactionId === familyActiveSubscription.transactionId) ? 1 : 0;
    }
  }

  return transactionsHistory;
}

/**
 * Attempts to use the provided parameters to find an associated userId
 * 1. Attempts to find users record with same appAccountToken, returns userId if found
 * 2. Attempts to find transactions record with same originalTransactionId, returns userId if found
 * 3. Attempts to find transactions record with same transactionId, returns userId if found
 * 4. Returns undefined
 * @param {*} databaseConnection
 * @param {*} appAccountToken
 * @param {*} transactionId
 * @param {*} originalTransactionId
 * @returns
 */
async function getTransactionOwner(databaseConnection: Queryable, appAccountToken?: string, transactionId?: number, originalTransactionId?: number): Promise<string | undefined> {
  if (appAccountToken !== undefined && appAccountToken !== null) {
    const result = await databaseQuery<PublicUsersRow[]>(
      databaseConnection,
      `SELECT ${publicUsersColumns} 
      FROM users u
      WHERE u.userAppAccountToken = ?
      LIMIT 1`,
      [appAccountToken],
    );

    const user = result.safeIndex(0);

    if (user !== undefined && user !== null) {
      return user.userId;
    }
  }

  // If the user supplied an originalTransactionId, search with this first to attempt to find the userId for the most recent associated transaction
  if (originalTransactionId !== undefined && originalTransactionId !== null) {
    // ALLOW TRANSACTIONS WITH revocationReason IS NOT NULL FOR MATCHING PURPOSES
    const result = await databaseQuery<TransactionsRow[]>(
      databaseConnection,
      `SELECT ${transactionsColumns}
        FROM transactions t
        WHERE originalTransactionId = ?
        ORDER BY purchaseDate DESC
        LIMIT 1`,
      [originalTransactionId],
    );

    const transaction = result.safeIndex(0);

    if (transaction !== undefined && transaction !== null) {
      return transaction.userId;
    }
  }

  // If the user supplied an transactionId, attempt to find the userId for the most recent associated transaction
  if (transactionId !== undefined && transactionId !== null) {
    // ALLOW TRANSACTIONS WITH revocationReason IS NOT NULL FOR MATCHING PURPOSES
    const result = await databaseQuery<TransactionsRow[]>(
      databaseConnection,
      `SELECT ${transactionsColumns}
        FROM transactions t
        WHERE transactionId = ?
        ORDER BY purchaseDate DESC
        LIMIT 1`,
      [transactionId],
    );

    const transaction = result.safeIndex(0);

    if (transaction !== undefined && transaction !== null) {
      return transaction.userId;
    }
  }

  return undefined;
}

export {
  getActiveTransaction, getAllTransactions, getTransactionOwner,
};
