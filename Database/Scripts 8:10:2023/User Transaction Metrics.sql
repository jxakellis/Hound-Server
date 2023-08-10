-- Active Subscriptions by ProductId, Number Renewing vs Not Renewing
SELECT
    REPLACE(productId, 'com.jonathanxakellis.hound.', '') AS product,
    COUNT(transactionId) AS 'Total Active Subscriptions',
    SUM(
        CASE 
        WHEN isAutoRenewing = 1 THEN 1
        ELSE 0 
        END
    ) AS 'Will Renew',
    SUM(
        CASE 
        WHEN isAutoRenewing = 0 THEN 1
        ELSE 0
        END
    ) AS 'Wont Renew'
FROM transactions
WHERE isRevoked = 0 AND DATEDIFF(expirationDate, CURRENT_TIMESTAMP) >= 0
GROUP BY productId;

-- Metrics on Subscription Duration and Free Trial Conversions
WITH 
FreeTrials AS (
    # Identifying transactions that are free trials based on their duration
    SELECT
        userId,
        familyId,
        productId,
        transactionId AS originalTransactionId,
        purchaseDate,
        expirationDate
    FROM transactions
    WHERE DATEDIFF(expirationDate, purchaseDate) BETWEEN 6 AND 8
),
Renewals AS (
    # Identifying all transactions that are renewals and exclude free trials
    SELECT
        userId,
        familyId,
        productId,
        originalTransactionId,
        purchaseDate,
        expirationDate
    FROM transactions
    WHERE DATEDIFF(expirationDate, purchaseDate) NOT BETWEEN 6 AND 8
    AND isRevoked = 0
),
Conversions AS (
    # Compute the users who converted from a free trial to a paid subscription
    SELECT
        f.userId,
        f.familyId,
        f.productId AS freeTrialProduct,
        r.productId AS renewalProduct
    FROM FreeTrials f
    JOIN Renewals r ON f.originalTransactionId = r.originalTransactionId
    WHERE r.purchaseDate > f.expirationDate
),
SubscriptionDuration AS (
    # Compute the total subscription duration for each user
    SELECT
        r.userId,
        r.familyId,
        r.productId,
        r.originalTransactionId,
        MIN(f.purchaseDate) AS startDate,
        MAX(r.expirationDate) AS endDate,
        DATEDIFF(MAX(r.expirationDate), MIN(f.purchaseDate)) AS totalDuration
    FROM Renewals r
    JOIN FreeTrials f ON r.originalTransactionId = f.originalTransactionId
    GROUP BY r.userId, r.familyId, r.productId, r.originalTransactionId
)
# Assemble the final metrics
SELECT
    REPLACE(s.productId, 'com.jonathanxakellis.hound.', '') AS 'Product',
    AVG(s.totalDuration) AS 'Average Subscription Days',
    STDDEV(s.totalDuration) AS 'Standard Deviation',
    COUNT(DISTINCT c.userId) AS 'Converted From Free Trial',
    COUNT(DISTINCT c.userId) / COUNT(DISTINCT f.userId) * 100 AS 'Conversion Rate (%)'
FROM SubscriptionDuration s
LEFT JOIN Conversions c ON s.userId = c.userId AND s.familyId = c.familyId
LEFT JOIN FreeTrials f ON s.userId = f.userId AND s.familyId = f.familyId
GROUP BY s.productId;
