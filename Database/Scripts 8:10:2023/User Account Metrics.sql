
/*
*****The Core Concept*****
To calculate retention for a cohort of users, we first need to determine when each user in the cohort was last active and then compare this to their sign-up date. The difference in days gives us the user's "lifetime" in days.

Using this data, we can calculate how many of the users in the cohort were still active on Day 1, Day 2, etc., after their sign-up.

*****SQL Components Explanation*****
1. Common Table Expressions (CTEs):
WITH ... AS: This SQL clause allows us to create temporary result sets (called CTEs) that can be referenced within the main SQL query.
CTEs are useful for breaking down complex queries into simpler parts.

2. LAG Function:
LAG(): This is a window function that returns a value from a row located at a specified physical offset from the row within the result set.
In our case, LAG(percent_active, 1, 0) OVER (ORDER BY days_since_signup) gets the value of percent_active from the previous row (one row above the current row).

3. OVER Clause:
The OVER clause defines a window or user-specified range of rows within a query result set. A window function then performs a calculation across the set of rows that fall into the window.
For the LAG() function, the ORDER BY within the OVER clause is specifying the order in which to access the rows to determine the "previous" row.

4. CASE WHEN:
This SQL clause provides conditional logic. It checks a condition and returns a value when that condition is met, and another value when it's not.

*****The Query Breakdown*****
1. user_age_cte:
This CTE calculates the age of each user account (in days) by subtracting the account creation date from the current date.

2. activity_days_cte:
This CTE calculates the number of days since account creation for each user activity.
It will result in multiple rows for users who were active on multiple days since signup.

3. aggregated_cte:
Here, we group the data by the number of days since signup.
For each day, we count the distinct number of active users and the total users to calculate the percentage of active users.

4. final_select:
We use the LAG function to calculate the day-over-day change in percentage.
 */

# We're creating a CTE (Common Table Expression) named DaysSinceCreation.
# Its purpose is to calculate the number of days that have passed since each user created their account.
WITH DaysSinceCreation AS (
    SELECT
        u.userId,
        -- Calculating the difference in days between the date of the request and the date the user account was created.
        DATEDIFF(pr.requestDate, u.userAccountCreationDate) AS DaysSinceCreation
    FROM users u
    JOIN previousRequests pr ON u.userId = 
        -- We're determining which user made the request. 
        -- If the requestUserId field exists, we use that. If not, we extract the userId from the requestOriginalURL.
        CASE 
            WHEN pr.requestUserId IS NOT NULL THEN pr.requestUserId 
            ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(pr.requestOriginalURL, '/user/', -1), '/', 1)
        END
    -- Ensuring that we only consider users who've been on the platform for a time period at least as long as 
    -- the difference between the request date and their account creation date.
    WHERE DATEDIFF(CURRENT_DATE, u.userAccountCreationDate) > DATEDIFF(pr.requestDate, u.userAccountCreationDate)
),
# Now, we're creating another CTE named Retention.
# Its purpose is to calculate the retention rate for users based on how many days they've been on the platform.
Retention AS (
    SELECT 
        DaysSinceCreation AS DayNumber,
        -- Counting unique active users for each day since their account creation.
        COUNT(DISTINCT userId) AS ActiveUsers,
        -- Calculating retention percentage. 
        -- We determine what proportion of the total user base (that's been on the platform for at least as long 
        -- as a given DayNumber) were active on that specific day.
        ROUND(
        	(
        		(COUNT(DISTINCT userId) * 100.0)
        		/ (SELECT COUNT(*) FROM users WHERE DATEDIFF(CURRENT_DATE, userAccountCreationDate) > DaysSinceCreation)
        	)
        , 2) AS RetentionPercentage
    FROM DaysSinceCreation
    GROUP BY DaysSinceCreation
)
# Our main SELECT statement then uses the Retention CTE to determine the day-over-day change in retention percentage.
SELECT 
    r.DayNumber AS 'Day Number',
    r.RetentionPercentage AS 'Total Retention (%)',
    # We're calculating the percentage change in retention from one day to the next.
    # Using the LAG function allows us to compare the current row's retention percentage with the previous row's.
    # If there's no previous row (like for the first day), the result is NULL.
    CASE 
        WHEN LAG(r.RetentionPercentage) OVER(ORDER BY r.DayNumber) IS NULL THEN NULL
        ELSE ROUND(
        	(
        		(r.RetentionPercentage - LAG(r.RetentionPercentage) OVER(ORDER BY r.DayNumber))
        		/ LAG(r.RetentionPercentage) OVER(ORDER BY r.DayNumber)
        	) * 100
        , 2)
    END AS 'Day-over-Day Change (%)'
FROM Retention r
ORDER BY r.DayNumber
LIMIT 100;

-- User Signups by Day, Average User Signups Per Day, and Change in Signups Over Time
WITH UserSignups AS (
    # Get signups based on date and the user identifier.
    SELECT 
        DATE(requestDate) AS signupDate, 
        COUNT(DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(requestOriginalURL, '/user?userIdentifier=', -1), '&', 1)) AS numberOfSignups
    FROM previousRequests 
    WHERE requestMethod = 'POST' AND requestOriginalURL LIKE '%/user?userIdentifier=%' 
    GROUP BY signupDate
),
RollingAvg AS (
    # Calculate a 7-day rolling average for signups.
    SELECT 
        signupDate,
        AVG(numberOfSignups) OVER (ORDER BY signupDate ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rollingAvg
    FROM UserSignups
)
SELECT 
    uS.signupDate, 
    uS.numberOfSignups,
    (SELECT AVG(numberOfSignups) FROM UserSignups) AS 'Average Signups',
    (uS.numberOfSignups - IFNULL(LAG(uS.numberOfSignups) OVER(ORDER BY uS.signupDate), 0)) AS 'Change From Previous Day',
    ROUND(
        IFNULL((uS.numberOfSignups - LAG(uS.numberOfSignups) OVER(ORDER BY uS.signupDate)) / NULLIF(LAG(uS.numberOfSignups) OVER(ORDER BY uS.signupDate), 0), 0) * 100, 2
    ) AS 'Percentage Change',
    rA.rollingAvg AS '7 Day Rolling Avg'
FROM UserSignups uS
JOIN RollingAvg rA ON uS.signupDate = rA.signupDate
ORDER BY uS.signupDate DESC;

