
# make a query to check how many users download the app and actually join a family and start a saubscription. 
#This will get first glance feedback to see how many get the app and actually decide to pursue it. 
# find out how many users actually get a subscription, etc.



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



-- Number of Sign Ups for Average Day in Last Day, Last Week, Last Month, Last Quarter, and Last Year
WITH 
TimeFrames AS (
    SELECT
        COUNT(*) AS signUpCount,
        CASE 
            WHEN userAccountCreationDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY) AND CURRENT_TIMESTAMP THEN 'Past Day'
            WHEN userAccountCreationDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) AND CURRENT_TIMESTAMP THEN 'Past 7 Days'
            WHEN userAccountCreationDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) AND CURRENT_TIMESTAMP THEN 'Past 30 Days'
            WHEN userAccountCreationDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY) AND CURRENT_TIMESTAMP THEN 'Past 90 Days'
            WHEN userAccountCreationDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 365 DAY) AND CURRENT_TIMESTAMP THEN 'Past 365 Days'
        END AS period
    FROM users
    GROUP BY period
)
SELECT
    period,
    CASE
        WHEN period = 'Past Day' THEN signUpCount
        WHEN period = 'Past 7 Days' THEN signUpCount / 7
        WHEN period = 'Past 30 Days' THEN signUpCount / 30
        WHEN period = 'Past 90 Days' THEN signUpCount / 90
        WHEN period = 'Past 365 Days' THEN signUpCount / 365
    END AS 'Sign Ups for Average Day in Period'
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

