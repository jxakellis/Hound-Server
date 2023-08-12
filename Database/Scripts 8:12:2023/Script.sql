

-- Metrics on Subscription Duration and Free Trial Conversions
WITH 
freeTrialTransactions AS (
    # Identifying transactions that are free trials
    SELECT
        productId,
        transactionId,
        originalTransactionId,
        purchaseDate,
        expirationDate
    FROM transactions t
    WHERE t.transactionId = t.originalTransactionId
    AND t.isRevoked = 0
),
freeTrialTransactionsWithAutoRenewal AS (
    # Adding whether or not the free trial transactions led to at least one non-free trial purchase
    SELECT
        ftt.productId,
        ftt.originalTransactionId,
        ftt.purchaseDate AS trialPurchaseDate,
        MAX(t.expirationDate) AS nonTrialExpirationDate,
        (t.originalTransactionId IS NOT NULL) AS ledToNonTrialTransaction
    FROM freeTrialTransactions ftt
    # Attempt to link a non free trial transaction. It should be linked to the free trial (ftt.origTranId = t.tranId) but is not a free trial itself (t.tranId != t.origTranId)
    LEFT JOIN transactions t ON (t.originalTransactionId = ftt.transactionId AND t.transactionId != t.originalTransactionId)
    GROUP BY ftt.originalTransactionId
)
# Assemble the final metrics
SELECT
	*
	#REPLACE(fttar.productId, 'com.jonathanxakellis.hound.', '') AS 'Product',
	#COUNT(DISTINCT fttar.originalTransactionId) AS 'Total Free Trials',
	#SUM(fttar.ledToNonTrialTransaction) AS 'Total Free Trial Conversions',
    #((SUM(fttar.ledToNonTrialTransaction) / COUNT(DISTINCT fttar.originalTransactionId)) * 100) AS 'Conversion Rate (%)'
FROM freeTrialTransactionsWithAutoRenewal fttar;
#GROUP BY fttar.productId;