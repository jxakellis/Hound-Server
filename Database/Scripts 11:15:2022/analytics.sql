# number of requests created
SELECT COUNT(requestId) FROM previousRequests LIMIT 1;
# number of requests (by hour) in the last 24 hours
SELECT HOUR(requestDate), COUNT(requestId) FROM previousRequests 
WHERE UNIX_TIMESTAMP(requestDate) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24) 
GROUP BY HOUR(requestDate)
ORDER BY requestDate DESC;

# number of users created
SELECT COUNT(userId) FROM users LIMIT 1;
# number of users created (by hour) in last 24 hours
SELECT HOUR(userAccountCreationDate), COUNT(userId) FROM users 
WHERE UNIX_TIMESTAMP(userAccountCreationDate) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24) 
GROUP BY HOUR(userAccountCreationDate)
ORDER BY userAccountCreationDate DESC;

# number of logs
SELECT COUNT(logId) FROM dogLogs LIMIT 1;
# number of logs modified (by hour) in the last 24 hours
SELECT HOUR(logLastModified), COUNT(logId) FROM dogLogs 
WHERE UNIX_TIMESTAMP(logLastModified) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24) 
GROUP BY HOUR(logLastModified)
ORDER BY logLastModified DESC;
# custom action names for active logs
SELECT logCustomActionName FROM dogLogs WHERE logCustomActionName != '' AND logIsDeleted = 0;

# number of reminders
SELECT COUNT(reminderId) FROM dogReminders LIMIT 1;
# number of active reminders
SELECT COUNT(reminderId) FROM dogReminders WHERE reminderIsDeleted = 0 AND reminderIsEnabled = 1 LIMIT 1;
# custom action names for active reminders
SELECT reminderCustomActionName FROM dogReminders WHERE reminderCustomActionName != '' AND reminderIsDeleted = 0 AND reminderIsEnabled = 1;