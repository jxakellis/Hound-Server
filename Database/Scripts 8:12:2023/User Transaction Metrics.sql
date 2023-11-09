-- Recent transactions (all)
SELECT  
	REPLACE(t.productId, 'com.jonathanxakellis.hound.sixfamilymembers.', '') AS 'Product',
	t.purchaseDate,
	t.expiresDate,
	# t.numberOfFamilyMembers,
	# t.numberOfDogs,
	t.autoRenewStatus,
	REPLACE(t.autoRenewProductId, 'com.jonathanxakellis.hound.sixfamilymembers.', '') AS 'Renewal Product',
	t.offerType,
	t.offerIdentifier,
	t.revocationReason
FROM transactions t
ORDER BY purchaseDate DESC;



-- Recent transactions (non-free trials)
SELECT 
	REPLACE(t.productId, 'com.jonathanxakellis.hound.sixfamilymembers.', '') AS 'Product',
	t.purchaseDate,
	# t.numberOfFamilyMembers,
	# t.numberOfDogs,
	t.autoRenewStatus,
	REPLACE(t.autoRenewProductId, 'com.jonathanxakellis.hound.sixfamilymembers.', '') AS 'Renewal Product',
	t.offerIdentifier,
	t.revocationReason
FROM transactions t
WHERE offerType IS NULL
ORDER BY purchaseDate DESC;



-- Number of active subscriptions for each productId, broken down by renewal status (TREATS FREE TRIALS AND PAID TRANSACTIONS AS EQUIVALENT)
WITH activeTransactionsWithRanks AS (
    SELECT
        userId,
        autoRenewProductId,
        autoRenewStatus,
        ROW_NUMBER() OVER (PARTITION BY userId ORDER BY 
            CASE 
                WHEN productId = 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly' THEN 1
                WHEN productId = 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly' THEN 2
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly' THEN 3
                WHEN productId = 'com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly' THEN 4
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymembers.onemonth' THEN 5
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymembers.sixmonth' THEN 6
                WHEN productId = 'com.jonathanxakellis.hound.sixfamilymembers.oneyear' THEN 7
                ELSE 0
            END DESC) AS correspondingRank
    FROM transactions t
    WHERE revocationReason = 0 AND TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP(), expiresDate) >= 0
),
activeHighestRankTransactions AS (
    SELECT 
        REPLACE(atwr.autoRenewProductId, 'com.jonathanxakellis.hound.', '') AS product,
        COUNT(DISTINCT CASE WHEN atwr.autoRenewStatus = 1 THEN atwr.userId END) AS renewingCount,
        COUNT(DISTINCT CASE WHEN atwr.autoRenewStatus = 0 THEN atwr.userId END) AS nonRenewingCount,
        CASE 
    		WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly' THEN 2.99
        	WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly' THEN 4.9
        	WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly' THEN 6.99
        	WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly' THEN 9.99
        	WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.sixfamilymembers.onemonth' THEN 6.99
        	WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.sixfamilymembers.sixmonth' THEN (27.99 / 6)
        	WHEN atwr.autoRenewProductId = 'com.jonathanxakellis.hound.sixfamilymembers.oneyear' THEN (34.99 / 12)
        	ELSE 0
    	END AS monthlyPrice
    FROM activeTransactionsWithRanks atwr
    WHERE atwr.correspondingRank = 1
    GROUP BY atwr.autoRenewProductId
)
SELECT 
    ahrt.product AS 'Product',
    ahrt.renewingCount AS 'Active Will Renew',
    ahrt.nonRenewingCount AS "Active Won't Renew",
    ROUND(((ahrt.renewingCount / (ahrt.renewingCount + ahrt.nonRenewingCount)) * 100), 1) AS 'Active Will Renew (%)',
    ROUND((ahrt.monthlyPrice * ahrt.renewingCount), 1) AS 'Expected Monthly Renewal Sales'
FROM activeHighestRankTransactions ahrt;



 

-- Number of expired free trials that converted to some paid transaction for each productId
WITH 
expiredFreeTrials AS (
    # Identifying transactions that are expired, non-revoked free trials
	# We only want expired free trials, as if they aren't expired then the users have not gotten a chance to convert into a paid subscription
    SELECT
        productId,
        transactionId,
        originalTransactionId
    FROM transactions t
    WHERE t.transactionId = t.originalTransactionId
    AND TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), expiresDate) < 0
    AND t.revocationReason = 0
),
expiredFreeTrialsWithPaidFlag AS (
    # Adding whether or not the free trial transactions led to at least one non-free trial purchase
    SELECT
        eft.productId,
        eft.originalTransactionId,
        (t.originalTransactionId IS NOT NULL) AS ledToPaidTransaction,
        # This means the user still has some form of subscription active. Not necessarily the same as the free trial product
        (TIMESTAMPDIFF(MICROSECOND, CURRENT_TIMESTAMP(), MAX(t.expiresDate)) >= 0) AS isPaidTransactionActive
    FROM expiredFreeTrials eft
    # Attempt to link a non free trial transaction. It should be linked to the free trial (eft.origTranId = t.tranId) but is not a free trial itself (t.tranId != t.origTranId)
    LEFT JOIN transactions t ON (t.originalTransactionId = eft.transactionId AND t.transactionId != t.originalTransactionId AND t.revocationReason = 0)
    GROUP BY eft.originalTransactionId
),
cumulativeMetrics AS (
	SELECT 
		productId,
		COUNT(DISTINCT eftpf.originalTransactionId) AS expiredFreeTrials,
		SUM(eftpf.ledToPaidTransaction) AS paidConversions,
		SUM(eftpf.isPaidTransactionActive) AS activePaidConversions
	FROM expiredFreeTrialsWithPaidFlag eftpf
	GROUP BY eftpf.productId
)
# Assemble the final metrics
SELECT
	REPLACE(cm.productId, 'com.jonathanxakellis.hound.', '') AS 'Product',
	cm.expiredFreeTrials AS 'Expired Free Trials',
	cm.paidConversions AS 'Paid Conversions',
    ROUND(((cm.paidConversions / cm.expiredFreeTrials) * 100), 1) AS 'Paid Conversion Rate (%)',
    # This means the user still has some form of subscription active. Not necessarily the same as the free trial product.
	cm.activePaidConversions AS 'Active Paid Conversions (could be diff from product)'
FROM cumulativeMetrics cm;





-- Number of transactions for average day in last day, week, month, quarter, and year
WITH 
TimeFrames AS (
    SELECT
        COUNT(*) AS transactionCount,
        CASE 
            WHEN purchaseDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY) AND CURRENT_TIMESTAMP THEN 'Past Day'
            WHEN purchaseDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) AND CURRENT_TIMESTAMP THEN 'Past 7 Days'
            WHEN purchaseDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) AND CURRENT_TIMESTAMP THEN 'Past 30 Days'
            WHEN purchaseDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY) AND CURRENT_TIMESTAMP THEN 'Past 90 Days'
            WHEN purchaseDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 365 DAY) AND CURRENT_TIMESTAMP THEN 'Past 365 Days'
        END AS period
    FROM transactions
    GROUP BY period
)
SELECT
    period AS 'Period',
    CASE
        WHEN period = 'Past Day' THEN transactionCount
        WHEN period = 'Past 7 Days' THEN transactionCount / 7
        WHEN period = 'Past 30 Days' THEN transactionCount / 30
        WHEN period = 'Past 90 Days' THEN transactionCount / 90
        WHEN period = 'Past 365 Days' THEN transactionCount / 365
    END AS 'Transactions for Average Day in Period'
FROM TimeFrames
WHERE period IS NOT NULL
ORDER BY 
    CASE
        WHEN period = 'Past Day' THEN 1
        WHEN period = 'Past 7 Days' THEN 2
        WHEN period = 'Past 30 Days' THEN 3
        WHEN period = 'Past 90 Days' THEN 4
        WHEN period = 'Past 365 Days' THEN 5
    END;
