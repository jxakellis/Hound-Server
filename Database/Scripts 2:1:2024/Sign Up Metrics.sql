
# make a query to check how many users download the app and actually join a family and start a saubscription. 
#This will get first glance feedback to see how many get the app and actually decide to pursue it. 
# find out how many users actually get a subscription, etc.





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

