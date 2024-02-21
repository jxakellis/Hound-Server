/*
 * NUMBER OF USERS WHO HAVE/HAD FAMILIES OF A GIVEN SIZE
 */
WITH combinedFamilyMembers AS (
    -- Combine current and previous families
    SELECT userId, familyId FROM familyMembers
    UNION ALL
    SELECT userId, familyId FROM previousFamilyMembers
),
familySize AS (
    -- Calculate the size of each family
    SELECT
        familyId,
        COUNT(DISTINCT userId) AS memberCount
    FROM combinedFamilyMembers
    GROUP BY familyId
),
usersWithFamilySize AS (
    -- Identify users from families meeting the criteria
    SELECT
    	DISTINCT cfm.userId,
    	fs.memberCount
    FROM combinedFamilyMembers cfm
    JOIN familySize fs ON cfm.familyId = fs.familyId
)
SELECT 
	uwfs.memberCount as "Family Size",
	COUNT(DISTINCT uwfs.userId) AS "Number of Users With Given Family Size",
	(COUNT(DISTINCT uwfs.userId) / uwfs.memberCount) AS "Number Of Families"
FROM usersWithFamilySize uwfs
GROUP BY uwfs.memberCount;



/*
 * NUMBER OF USERS WHO CREATED A GIVEN NUMBER OF LOGS
 */
WITH combinedUsers AS (
    SELECT userId FROM users
    UNION ALL
    SELECT userId FROM previousUsers
),
dogLogCounts AS (
    SELECT
        cu.userId,
        COUNT(DISTINCT dl.logId) AS dogLogCount
    FROM combinedUsers cu
    LEFT JOIN dogLogs dl ON cu.userId = dl.userId
    GROUP BY cu.userId
),
totalUserCount AS (
    SELECT COUNT(DISTINCT cu.userId) AS totalUsers
    FROM combinedUsers cu
)
SELECT 
	dlc.dogLogCount AS "Log Count",
	COUNT(dlc.userId) AS "Number of Users With Given Log Count",
	ROUND((COUNT(dlc.userId) * 1.0 / (SELECT totalUsers FROM totalUserCount) * 100.0), 2) AS "Fraction of Users (%)"
FROM dogLogCounts dlc
GROUP BY dlc.dogLogCount;



/*
 * NUMBER OF ACTIVE ACCOUNTS PER ACCOUNT AGE PER TIME FRAME
 */
WITH combinedUsers AS (
    SELECT userId, userAccountCreationDate, userLatestRequestDate FROM users
    UNION ALL
    SELECT userId, userAccountCreationDate, userLatestRequestDate FROM previousUsers
),
eligibleUsers AS (
    SELECT 
        userId,
        userAccountCreationDate,
        userLatestRequestDate,
        CASE
            WHEN DATEDIFF(CURRENT_TIMESTAMP, userAccountCreationDate) > 365 THEN "Accounts Older Than 365 Days"
            WHEN DATEDIFF(CURRENT_TIMESTAMP, userAccountCreationDate) > 90 THEN "Accounts Older Than 90 Days"
            WHEN DATEDIFF(CURRENT_TIMESTAMP, userAccountCreationDate) > 30 THEN "Accounts Older Than 30 Days"
            WHEN DATEDIFF(CURRENT_TIMESTAMP, userAccountCreationDate) > 7 THEN "Accounts Older Than 7 Days"
            WHEN DATEDIFF(CURRENT_TIMESTAMP, userAccountCreationDate) > 1 THEN "Accounts Older Than 1 Day"
        END AS accountAgeCategory
    FROM combinedUsers
    WHERE DATEDIFF(CURRENT_TIMESTAMP, userAccountCreationDate) > 1
),
activityCounts AS (
    SELECT
        accountAgeCategory,
        SUM(CASE WHEN userLatestRequestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY) AND CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS activePastDay,
        SUM(CASE WHEN userLatestRequestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) AND CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS activePast7Days,
        SUM(CASE WHEN userLatestRequestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) AND CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS activePast30Days,
        SUM(CASE WHEN userLatestRequestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY) AND CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS activePast90Days,
        SUM(CASE WHEN userLatestRequestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 365 DAY) AND CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS activePast365Days
    FROM eligibleUsers
    GROUP BY accountAgeCategory
)
SELECT 
        accountAgeCategory AS "Account Age",
        activePastDay AS "Active Past Day",
        activePast7Days AS "Active Past 7 Days",
        activePast30Days AS "Active Past 30 Days",
        activePast90Days AS "Active Past 90 Days",
        activePast365Days AS "Active Past 365 Days"
FROM activityCounts
ORDER BY 
    CASE accountAgeCategory
        WHEN "Accounts Older Than 365 Days" THEN 5
        WHEN "Accounts Older Than 90 Days" THEN 4
        WHEN "Accounts Older Than 30 Days" THEN 3
        WHEN "Accounts Older Than 7 Days" THEN 2
        WHEN "Accounts Older Than 1 Day" THEN 1
    END;
   
/*
 * ACCOUNTS WITH AN EMAIL THAT ARE INACTIVE
 */
WITH combinedUsers AS (
    SELECT userId, userFirstName, userLastName, userEmail, userAccountCreationDate, userLatestRequestDate FROM users
    UNION ALL
    SELECT userId, userFirstName, userLastName, userEmail, userAccountCreationDate, userLatestRequestDate FROM previousUsers
),
usersWithMetrics AS (
	SELECT
		cu.userId,
		cu.userFirstName,
		cu.userLastName,
		cu.userEmail,
		cu.userAccountCreationDate,
		cu.userLatestRequestDate,
		DATEDIFF(CURRENT_DATE() , cu.userAccountCreationDate) AS accountAge, 
		DATEDIFF(CURRENT_DATE() , cu.userLatestRequestDate) AS daysInactive
	FROM combinedUsers cu
) 
SELECT 
	uwm.userFirstName,
	uwm.userLastName,
	uwm.userEmail,
	DATE_FORMAT(uwm.userAccountCreationDate, '%Y-%m-%d') AS "Account Creation Date",
	(uwm.accountAge - uwm.daysInactive) AS "Number of Days Active",
	DATE_FORMAT(uwm.userLatestRequestDate, '%Y-%m-%d') AS "Last Active Date"
FROM usersWithMetrics uwm
WHERE 
	uwm.daysInactive >= 30
	AND uwm.userEmail IS NOT NULL
ORDER BY uwm.accountAge ASC;
 


/*
 * PERCENTAGE OF USERS STILL ACTIVE AFTER A CERTAIN NUMBER OF DAYS
 */
WITH combinedUsers AS (
    SELECT userId, userAccountCreationDate, userLatestRequestDate FROM users
    UNION ALL
    SELECT userId, userAccountCreationDate, userLatestRequestDate FROM previousUsers
),
targetUsers AS (
	SELECT
		cu.userId,
		cu.userAccountCreationDate,
		cu.userLatestRequestDate,
		DATEDIFF(cu.userLatestRequestDate, cu.userAccountCreationDate) AS numberOfDaysActiveFromAccountCreation
	FROM combinedUsers cu
	WHERE DATEDIFF(CURRENT_DATE, cu.userAccountCreationDate) >= 60 AND DATEDIFF(CURRENT_DATE, cu.userAccountCreationDate) <= 150
),
retention AS (
    SELECT 
        daysFromAccountCreation,
        numberOfUsersStillActive,
        originalNumberOfActiveUsers,
        ROUND((numberOfUsersStillActive / CAST(originalNumberOfActiveUsers AS FLOAT)) * 100.0, 2) AS retentionPercentage
    FROM (
        SELECT 
            tu.numberOfDaysActiveFromAccountCreation AS daysFromAccountCreation,
            (SELECT COUNT(*) FROM targetUsers subTU WHERE subTU.numberOfDaysActiveFromAccountCreation >= tu.numberOfDaysActiveFromAccountCreation) AS numberOfUsersStillActive,
            (SELECT COUNT(*) FROM targetUsers) AS originalNumberOfActiveUsers
        FROM targetUsers tu
        GROUP BY tu.numberOfDaysActiveFromAccountCreation
    ) AS subquery
)
SELECT 
    r.daysFromAccountCreation AS 'Days From Account Creation',
    r.retentionPercentage AS 'Total Users Retained (%)',
    # We're calculating the percentage change in retention from one day to the next.
    # Using the LAG function allows us to compare the current row's retention percentage with the previous row's.
    # If there's no previous row (like for the first day), the result is NULL.
    CASE 
        WHEN LAG(r.retentionPercentage) OVER(ORDER BY r.daysFromAccountCreation) IS NULL THEN NULL
        ELSE ROUND(
        	(
        		(r.retentionPercentage - LAG(r.retentionPercentage) OVER(ORDER BY r.daysFromAccountCreation))
        		/ LAG(r.retentionPercentage) OVER(ORDER BY r.daysFromAccountCreation)
        	) * 100
        , 2)
    END AS 'Day-over-Day Change (%)'
FROM retention r
WHERE r.daysFromAccountCreation <= 60
ORDER BY r.daysFromAccountCreation;