import { type TransactionsRow } from '../../main/types/TransactionsRow.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

// TODO NOW create indexes on different important table columns

async function getAffiliateTransactionsForOfferIdentifier(databaseConnection: Queryable, offerIdentifier: string): Promise<TransactionsRow[]> {
  /*
For a transaction by a user to be eligible for an affiliate reward, it must pass four requirements:
    - The transaction must have a matching offer identifier
    - The user who purchased the transaction must not have purchased a Hound subscription previously
    - The user who purchased the transaction must not have used a different offer identifier or free trial previously
    - The user who purchased the transaction must not have been in a different family previously

To accomplish this, we use a multi-step SQL query
    oldestTransactions:
        # For each userId in transactions, rank the transactions by purchase date.
        # The oldest will have rank 1.
    qualifiedTransactions:
        # Select the transaction that have a rank of 1, which are the oldest per user
        # This should get either a free trial or offer identifier transaction
        # Then filter for transactions for only those with the correct offer identifier
    usersCurrentlyInFamilies:
        #
    usersPreviouslyInFamilies:
        #
    qualifiedTransactionsWithUserInformation:
        # For each userId that has a qualified transaction, get a few metrics
        # Get the currentFamilyId of the family they are in or null
        # Get the number of families they were previously in
    result:
        # If numberOfPreviousFamilies = 0, then the user is qualified (they weren't in any previous family)
        # If numberOfPreviousFamilies = 1, then
            # If currentFamilyId is null, then the user is qualified (they aren't in a family current, but used to be in a single one)
            # If currentFamilyId is not null and currentFamilyId = familyId of previous family, then the user is qualified (they are/were only ever in one family, but have previously left their current one)
        # If numberOfPreviousFamilies > 1, then the user isn't qualified (they were in multiple previous, different families)
*/

  const eligibleTransactions = await databaseQuery<TransactionsRow[]>(
    databaseConnection,
    `WITH oldestTransactions AS (
        SELECT
          t.*,
          RANK() OVER (PARTITION BY userId ORDER BY purchaseDate ASC) AS transactionRank
        FROM transactions t
      ),
      qualifiedTransactions AS (
        SELECT
          ot.*
        FROM oldestTransactions ot
        WHERE ot.transactionRank = 1 AND ot.offerIdentifier = ?
      ),
      usersCurrentlyInFamilies AS (
        SELECT
          fm.userId,
          fm.familyId AS currentFamilyId,
          pfm.familyId AS previousFamilyId
        FROM familyMembers fm
        LEFT JOIN previousFamilyMembers pfm ON fm.userId = pfm.userId
      ),
      usersPreviouslyInFamilies AS (
        SELECT
          pfm.userId,
          COUNT(DISTINCT pfm.familyId) AS numberOfPreviousFamilies
        FROM previousFamilyMembers pfm
        GROUP BY pfm.userId
      ),
      qualifiedTransactionsWithUserInformation AS (
        SELECT
            qt.*,
            ucif.currentFamilyId,
            ucif.previousFamilyId,
            IFNULL(upif.numberOfPreviousFamilies, 0) AS numberOfPreviousFamilies
        FROM qualifiedTransactions qt
        LEFT JOIN usersCurrentlyInFamilies ucif ON qt.userId = ucif.userId
        LEFT JOIN usersPreviouslyInFamilies upif ON qt.userId = upif.userId
      )
      SELECT
        qtwui.*
      FROM
        qualifiedTransactionsWithUserInformation qtwui
      WHERE
          IFNULL(qtwui.numberOfPreviousFamilies, 0) = 0
          OR (IFNULL(qtwui.numberOfPreviousFamilies, 0) = 1 
              AND (
                      qtwui.currentFamilyId IS NULL
                      OR qtwui.currentFamilyId = qtwui.previousFamilyId
                  )
              )`,
    [offerIdentifier],
  );

  return eligibleTransactions;
}

export {
  getAffiliateTransactionsForOfferIdentifier,
};
