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
PeriodAverages AS (
    # Calculate the average requests for each period and hour.
    SELECT
        hourOfDay,
        AVG(CASE WHEN requestDay >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) THEN hourlyRequests END) AS avg7Days,
        AVG(CASE WHEN requestDay >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN hourlyRequests END) AS avg30Days,
        AVG(CASE WHEN requestDay >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY) THEN hourlyRequests END) AS avg90Days,
        AVG(hourlyRequests) AS avgOverall
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
# Join the PeriodAverages CTE to get the desired result.
SELECT 
    hrl.hourOfDay AS 'Hour of Day',
    hrl.numberOfRequests AS 'Number of Requests',
    pa.avg7Days AS 'Average Last 7 Days',
    pa.avg30Days AS 'Average Last 30 Days',
    pa.avg90Days AS 'Average Last 90 Days',
    pa.avgOverall AS 'Average Overall'
FROM HourlyRequestsLast24Hrs hrl
LEFT JOIN PeriodAverages pa ON hrl.hourOfDay = pa.hourOfDay
ORDER BY hrl.hourOfDay;





-- Average Requests by Day
WITH 
TimeFrames AS (
    SELECT
        COUNT(*) AS queryCount,
        CASE 
            WHEN requestDate BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) AND CURRENT_DATE THEN 'Yesterday'
            WHEN requestDate >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) AND requestDate < DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) THEN 'Past 7 Days'
            WHEN requestDate >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) AND requestDate < DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) THEN 'Past 30 Days'
            WHEN requestDate >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY) AND requestDate < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN 'Past 90 Days'
            WHEN requestDate >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY) AND requestDate < DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY) THEN 'Past 365 Days'
        END AS period
    FROM previousRequests
    GROUP BY period
)
SELECT
    period,
    CASE
        WHEN period = 'Yesterday' THEN queryCount
        WHEN period = 'Past 7 Days' THEN queryCount / 7
        WHEN period = 'Past 30 Days' THEN queryCount / 30
        WHEN period = 'Past 90 Days' THEN queryCount / 90
        WHEN period = 'Past 365 Days' THEN queryCount / 365
    END AS averageQueries
FROM TimeFrames
WHERE period IS NOT NULL
ORDER BY 
    CASE
        WHEN period = 'Yesterday' THEN 1
        WHEN period = 'Past 7 Days' THEN 2
        WHEN period = 'Past 30 Days' THEN 3
        WHEN period = 'Past 90 Days' THEN 4
        WHEN period = 'Past 365 Days' THEN 5
    END;



   
   
-- Most Recent 100 Failed Requests
SELECT 
    pReq.requestId,
	pReq.requestIP,
	pReq.requestDate,
	pReq.requestMethod,
	pReq.requestOriginalURL,
	pReq.requestBody,
	pReq.requestAppVersion,
    pRes.responseStatus,
    pRes.responseBody
FROM previousRequests pReq
JOIN previousResponses pRes ON pReq.requestId = pRes.requestId 
WHERE 
    # If responseStatus is not null, check if it's not in the 200-299 range
    (pRes.responseStatus IS NOT NULL AND (pRes.responseStatus < 200 OR pRes.responseStatus > 299))
    OR 
    # If responseStatus is null, look for the word "message" in responseBody to identify a failure
    (pRes.responseStatus IS NULL AND JSON_EXTRACT(pRes.responseBody, '$.message') IS NOT NULL)
ORDER BY pReq.requestDate DESC
LIMIT 100;

-- Average Number of Requests Per Active User
SELECT 
    COUNT(requestId) / COUNT(DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(requestOriginalURL, '/user/', -1), '/', 1)) AS 'Average Requests per User'
FROM previousRequests;
