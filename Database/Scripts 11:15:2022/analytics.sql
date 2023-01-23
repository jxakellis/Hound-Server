# number of requests created, 
SELECT COUNT(requestId) FROM previousRequests LIMIT 1;
# number of requests (by hour) in the last 24 hours (excluding watchdog requests)
SELECT HOUR(requestDate), COUNT(requestId) FROM previousRequests 
WHERE UNIX_TIMESTAMP(requestDate) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24) 
AND requestOriginalURL != '/watchdog'
GROUP BY HOUR(requestDate)
ORDER BY requestDate DESC;

SELECT * FROM previousRequests ORDER BY requestDate DESC LIMIT 100;
SELECT * FROM previousResponses ORDER BY responseDate DESC LIMIT 100;

# number of users created
SELECT COUNT(userId) FROM users LIMIT 1;
# number of active users with a week old account that have made a request in the past day
SELECT COUNT(DISTINCT users.userId) as 'Active Users' FROM users, previousRequests
WHERE 
UNIX_TIMESTAMP(previousRequests.requestDate) > (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24 * 1)
AND UNIX_TIMESTAMP(users.userAccountCreationDate) < (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24 * 7)
AND INSTR(previousRequests.requestOriginalURL, users.userId) > 0 
LIMIT 1;
# number of users created (by day) in last month
SELECT DAY(userAccountCreationDate), COUNT(userId) FROM users 
WHERE UNIX_TIMESTAMP(userAccountCreationDate) > (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24 * 30) 
GROUP BY DAY(userAccountCreationDate)
ORDER BY userAccountCreationDate DESC;

# number of logs
SELECT COUNT(logId) FROM dogLogs LIMIT 1;
# number of logs modified (by hour) in the last 24 hours
SELECT HOUR(logLastModified), COUNT(logId) FROM dogLogs 
WHERE UNIX_TIMESTAMP(logLastModified) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24) 
GROUP BY HOUR(logLastModified)
ORDER BY logLastModified DESC;
# custom action names for active logs
SELECT logCustomActionName, COUNT(logCustomActionName) FROM dogLogs WHERE logCustomActionName != '' AND logIsDeleted = 0 GROUP BY logCustomActionName;

# number of active reminders
SELECT COUNT(reminderId) FROM dogReminders WHERE reminderIsDeleted = 0 AND reminderIsEnabled = 1 LIMIT 1;
# custom action names for active reminders
SELECT reminderCustomActionName, COUNT (reminderCustomActionName) FROM dogReminders WHERE reminderCustomActionName != '' AND reminderIsDeleted = 0 AND reminderIsEnabled = 1 GROUP BY reminderCustomActionName;

# all transactions
SELECT transactionId, userId, REPLACE(productId, 'com.jonathanxakellis.hound.', '') as 'product', purchaseDate, expirationDate, isAutoRenewing, isRevoked FROM transactions ORDER BY purchaseDate DESC;
# for each productId, shows number of non-expired, non-revoked subscriptions.
SELECT
REPLACE(productId, 'com.jonathanxakellis.hound.', '') AS 'Product',
COUNT(1) AS 'Currently Subscribed',
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
) AS "Won't Renew"
FROM transactions
WHERE isRevoked = 0 AND expirationDate >= CURRENT_TIMESTAMP() AND UNIX_TIMESTAMP(expirationDate) > (UNIX_TIMESTAMP(purchaseDate) + 60 * 60 * 24 * 0)
GROUP BY productId;

# previous family members
SELECT * FROM previousFamilyMembers; 

# notifications
SELECT * FROM appStoreServerNotifications ORDER BY signedDate DESC;

# errors
SELECT * FROM previousServerErrors WHERE UNIX_TIMESTAMP(errorDate) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24 * 7) ORDER BY errorDate DESC;
