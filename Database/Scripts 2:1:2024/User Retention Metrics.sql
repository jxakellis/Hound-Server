-- Number of Users Who Have/Had Families of Different Sizes
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



-- Number of Users Who Have/Had Families of Different Sizes
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



--- Percentage of User Retained (still active) After a Certain Number of Days From Their Account Creation
# Only target users that were created within a certain time span
WITH TargetUserBase AS (
	SELECT
		u.userId,
		u.userAccountCreationDate
	FROM users u
	WHERE DATEDIFF(CURRENT_DATE, u.userAccountCreationDate) >= 60 AND DATEDIFF(CURRENT_DATE, u.userAccountCreationDate) <= 150
),
# For our target users, link them with each of their requests
UserRequestActivity AS (
    SELECT
        tub.userId,
        -- Calculate how old the account was when the request was made, showing the user was active x days from their account was created
        DATEDIFF(pr.requestDate, tub.userAccountCreationDate) AS requestDateDayDifferenceFromAccountCreation
    FROM TargetUserBase tub
    JOIN previousRequests pr ON tub.userId = pr.requestUserId
    -- This should never be negative but sometimes is. All requests should take place after an account is made.
    WHERE DATEDIFF(pr.requestDate, tub.userAccountCreationDate) >= 0
),
# Calculate the retention rate for users based on how many days they've been on the platform.
Retention AS (
    SELECT 
        ura.requestDateDayDifferenceFromAccountCreation AS daysFromAccountCreation,
        -- Counting unique active users for each day since their account creation.
        COUNT(DISTINCT ura.userId) AS numberOfUsersStillActive,
        -- Calculating retention percentage. 
        -- We determine what proportion of the total user base (that's been on the platform for at least as long as a given DayNumber) were active on that specific day.
        ROUND(
        	(
        		(COUNT(DISTINCT ura.userId) * 100.0)
        		/ (SELECT COUNT(*) FROM TargetUserBase tub WHERE DATEDIFF(CURRENT_DATE, tub.userAccountCreationDate) > ura.requestDateDayDifferenceFromAccountCreation)
        	)
        , 2) AS retentionPercentage
    FROM UserRequestActivity ura
    GROUP BY ura.requestDateDayDifferenceFromAccountCreation
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
FROM Retention r
ORDER BY r.daysFromAccountCreation
LIMIT 60;