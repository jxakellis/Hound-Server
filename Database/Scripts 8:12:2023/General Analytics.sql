
# number of logs
SELECT COUNT(logId) FROM dogLogs LIMIT 1;

# number of logs modified (by hour) in the last 24 hours
SELECT HOUR(logLastModified), COUNT(logId) FROM dogLogs 
WHERE UNIX_TIMESTAMP(logLastModified) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24) 
GROUP BY HOUR(logLastModified)
ORDER BY logLastModified DESC;

# num logs, avg logs / day (by family)
SELECT  
    u.userLastName, 
    f.familyAccountCreationDate,
    COUNT(dl.logId) as "Num Logs", 
    # CASE WHEN fixes div by zero error
    COUNT(dl.logId) / (CASE WHEN DATEDIFF(MAX(dl.logDate), f.familyAccountCreationDate) = 0 THEN 1 ELSE DATEDIFF(MAX(dl.logDate), f.familyAccountCreationDate) END) AS "Avg Logs / Day",
    MAX(dl.logDate) AS "Most Recent Log"
FROM 
    dogLogs dl
JOIN 
    dogs d ON dl.dogId = d.dogId
JOIN 
    families f ON d.familyId = f.familyId
JOIN 
    users u ON f.familyHeadUserId = u.userId
GROUP BY 
    f.familyId
ORDER BY
    COUNT(dl.logId) DESC;

# custom action names for active logs
SELECT logCustomActionName, COUNT(logCustomActionName) FROM dogLogs WHERE logCustomActionName != '' AND logIsDeleted = 0 GROUP BY logCustomActionName ORDER BY logDate DESC; 

# number of active reminders
SELECT COUNT(reminderId) FROM dogReminders WHERE reminderIsDeleted = 0 AND reminderIsEnabled = 1 AND UNIX_TIMESTAMP(reminderExecutionDate) >= UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) LIMIT 1;
# custom action names for active reminders
SELECT reminderCustomActionName, COUNT (reminderCustomActionName) FROM dogReminders WHERE reminderCustomActionName != '' AND reminderIsDeleted = 0 AND reminderIsEnabled = 1 GROUP BY reminderCustomActionName;

# previous family members
SELECT * FROM previousFamilyMembers; 

# notifications
SELECT * FROM appStoreServerNotifications ORDER BY signedDate DESC;

# errors
SELECT * FROM previousServerErrors WHERE UNIX_TIMESTAMP(errorDate) >= (UNIX_TIMESTAMP(CURRENT_TIMESTAMP()) - 60 * 60 * 24 * 7) ORDER BY errorDate DESC;
