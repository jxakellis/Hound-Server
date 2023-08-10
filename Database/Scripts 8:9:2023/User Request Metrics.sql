-- Total Number of Requests
SELECT COUNT(requestId) AS 'Total Requests' 
FROM previousRequests;

-- Requests by Hour in Last 24 Hours vs. Average Requests in That Hour
WITH 
HourlyHistoricalCounts AS (
    # Calculate the count for each hour over all the available data.
    SELECT 
        DATE(requestDate) AS requestDay,
        HOUR(requestDate) AS hourOfDay, 
        COUNT(requestId) AS hourlyRequests
    FROM previousRequests 
    WHERE requestOriginalURL != '/watchdog'
    GROUP BY requestDay, hourOfDay
),
HourlyHistoricalAverage AS (
    # Calculate the average requests for each hour.
    SELECT
        hourOfDay,
        AVG(hourlyRequests) AS averageRequests
    FROM HourlyHistoricalCounts
    GROUP BY hourOfDay
),
HourlyRequestsLast24Hrs AS (
    # Calculate the number of requests for each hour over the last 24 hours.
    SELECT 
        HOUR(requestDate) AS hourOfDay, 
        COUNT(requestId) AS numberOfRequests
    FROM previousRequests 
    WHERE requestDate >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
    GROUP BY hourOfDay
)
# Join the above two CTEs to get the desired result.
SELECT 
    hrl.hourOfDay AS 'Hour of Day',
    hrl.numberOfRequests AS 'Number of Requests',
    hha.averageRequests AS 'Average Request for Hour of Day'
FROM HourlyRequestsLast24Hrs hrl
LEFT JOIN HourlyHistoricalAverage hha ON hrl.hourOfDay = hha.hourOfDay
ORDER BY hrl.hourOfDay;


-- Requests by Day for the Past Week vs. Average Requests on That Day of the Week
WITH 
DailyHistoricalCounts AS (
    # Calculate the count for each day of the week over all the available data.
    SELECT 
        DATE(requestDate) AS requestDate,
        DAYOFWEEK(requestDate) AS dayOfWeek, 
        COUNT(requestId) AS dailyRequests
    FROM previousRequests 
    GROUP BY requestDate
),
DailyHistoricalAverage AS (
    # Calculate the average requests for each day of the week.
    SELECT
        dayOfWeek,
        AVG(dailyRequests) AS averageRequests
    FROM DailyHistoricalCounts
    GROUP BY dayOfWeek
),
DailyRequestsLastWeek AS (
    # Calculate the number of requests for each day over the past week.
    SELECT 
        DAYOFWEEK(requestDate) AS dayOfWeek, 
        COUNT(requestId) AS numberOfRequests
    FROM previousRequests
    WHERE requestDate >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
    GROUP BY dayOfWeek
)
# Join the above CTEs to get the desired result.
SELECT 
    CASE
        WHEN drlw.dayOfWeek = 1 THEN 'Sunday'
        WHEN drlw.dayOfWeek = 2 THEN 'Monday'
        WHEN drlw.dayOfWeek = 3 THEN 'Tuesday'
        WHEN drlw.dayOfWeek = 4 THEN 'Wednesday'
        WHEN drlw.dayOfWeek = 5 THEN 'Thursday'
        WHEN drlw.dayOfWeek = 6 THEN 'Friday'
        ELSE 'Saturday'
    END AS "Day of Week",
    drlw.numberOfRequests AS "Number of Requests",
    dha.averageRequests AS "Average Requests for Day of Week"
FROM DailyRequestsLastWeek drlw
LEFT JOIN DailyHistoricalAverage dha ON drlw.dayOfWeek = dha.dayOfWeek
ORDER BY drlw.dayOfWeek;


-- Most Recent 100 Failed Requests
SELECT 
    previousRequests.requestDate, 
    previousRequests.requestMethod, 
    previousRequests.requestOriginalURL, 
    previousRequests.requestBody, 
    previousResponses.responseStatus, 
    previousResponses.responseBody
FROM previousRequests 
JOIN previousResponses ON previousRequests.requestId = previousResponses.requestId 
WHERE 
    # If responseStatus is not null, check if it's not in the 200-299 range
    (previousResponses.responseStatus IS NOT NULL AND (previousResponses.responseStatus < 200 OR previousResponses.responseStatus > 299))
    OR 
    # If responseStatus is null, look for the word "message" in responseBody to identify a failure
    (previousResponses.responseStatus IS NULL AND previousResponses.responseBody LIKE '%message%')
ORDER BY previousRequests.requestDate DESC
LIMIT 100;

-- Average Number of Requests Per Active User
SELECT 
    COUNT(requestId) / COUNT(DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(requestOriginalURL, '/user/', -1), '/', 1)) AS 'Average Requests per User'
FROM previousRequests;
