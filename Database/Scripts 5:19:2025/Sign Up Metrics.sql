
/*
 * AVERAGE NUMBER OF SIGN UPS PER TIME PERIOD
 */
WITH timeFrames AS (
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
FROM timeFrames
WHERE period IS NOT NULL
ORDER BY 
    CASE
        WHEN period = 'Past Day' THEN 1
        WHEN period = 'Past 7 Days' THEN 2
        WHEN period = 'Past 30 Days' THEN 3
        WHEN period = 'Past 90 Days' THEN 4
        WHEN period = 'Past 365 Days' THEN 5
    END;
   
   
  
   SELECT * FROM users ORDER BY userAccountCreationDate DESC;
  
  
  
/*
 *	NUMBER OF SIGN UPS FOR A GIVEN DATE
 */
WITH combinedUsers AS (
    SELECT userId, userAccountCreationDate FROM users
    UNION ALL
    SELECT userId, userAccountCreationDate FROM previousUsers
),
timeFrames AS (
    SELECT
    	userAccountCreationDate,
        COUNT(*) AS signUpCount
    FROM users
    GROUP BY DATEDIFF(CURRENT_TIMESTAMP(), userAccountCreationDate)
)
SELECT
    DATE_FORMAT(userAccountCreationDate, '%Y-%m-%d') AS 'Sign Up Date',
    signUpCount AS 'Sign Ups for Date'
FROM timeFrames;

