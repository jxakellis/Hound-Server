import { transactionsColumns, type TransactionsRow } from '../../main/types/TransactionsRow.js';
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

  // TODO NOW test this query. we haven't tested family matching, but query gets oldest off ident trans for user. make sure fam logic works

  const eligibleTransactions = await databaseQuery<TransactionsRow[]>(
    databaseConnection,
    `WITH oldestTransactions AS (
        SELECT
          ${transactionsColumns},
          RANK() OVER (PARTITION BY userId ORDER BY purchaseDate ASC) AS transactionRank
        FROM transactions t
      ),
      qualifiedTransactions AS (
        SELECT
            ${transactionsColumns}
        FROM oldestTransactions t
        WHERE t.transactionRank = 1 AND t.offerIdentifier = ?
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
            ${transactionsColumns},
            ucf.currentFamilyId,
            ucf.previousFamilyId,
            IFNULL(upf.numberOfPreviousFamilies, 0) AS numberOfPreviousFamilies
        FROM qualifiedTransactions t
        LEFT JOIN usersCurrentlyInFamilies ucf ON t.userId = ucf.userId
        LEFT JOIN usersPreviouslyInFamilies upf ON t.userId = upf.userId
      )
      SELECT
        ${transactionsColumns}
      FROM
        qualifiedTransactionsWithUserInformation t
      WHERE
          IFNULL(t.numberOfPreviousFamilies, 0) = 0
          OR (IFNULL(t.numberOfPreviousFamilies, 0) = 1 
              AND (
                      t.currentFamilyId IS NULL
                      OR t.currentFamilyId = t.previousFamilyId
                  )
              )`,
    [offerIdentifier],
  );

  return eligibleTransactions;
}

export {
  getAffiliateTransactionsForOfferIdentifier,
};
