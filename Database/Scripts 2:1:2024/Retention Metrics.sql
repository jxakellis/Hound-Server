/*
 * NUMBER OF USERS WHO HAVE/HAD FAMILIES OF DIFFERENT SIZES
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
# Our main SELECT statement then uses the Retention CTE to determine the day-over-day change in retention percentage.
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