-- Total Number of Requests
SELECT COUNT(requestId) AS 'Total Requests' 
FROM previousRequests;





-- Most Recent 100 Requests
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
    pReq.requestAppVersion = '3.0.0'
    # pReq.requestOriginalURL LIKE '%001473.77422360ac5b4f8aabf48f816149efe8.1644%'
ORDER BY pReq.requestId DESC
LIMIT 100;





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





-- Number of Requests for Average Hour in Last Day, Last Week, Last Month, Last Quarter, and Last Year
WITH 
HourlyHistoricalCounts AS (
    # Calculate the count for each hour over all the available data.
    SELECT 
        DATE(requestDate) AS requestDay,
        HOUR(requestDate) AS hourOfDay, 
        COUNT(requestId) AS numberOfRequestForDayForHour
    FROM previousRequests 
    WHERE requestOriginalURL != '/watchdog'
    GROUP BY requestDay, hourOfDay
)
# Calculate the average requests for each period and hour.
SELECT
	hourOfDay AS 'Hour of Day',
	SUM(CASE WHEN requestDay BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY) AND CURRENT_TIMESTAMP THEN numberOfRequestForDayForHour ELSE 0 END) / 1 AS 'Average Last Day',
	SUM(CASE WHEN requestDay BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) AND CURRENT_TIMESTAMP THEN numberOfRequestForDayForHour ELSE 0 END) / 7 AS 'Average Last 7 Days',
	SUM(CASE WHEN requestDay BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) AND CURRENT_TIMESTAMP THEN numberOfRequestForDayForHour ELSE 0 END) / 30 AS 'Average Last 30 Days',
	SUM(CASE WHEN requestDay BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY) AND CURRENT_TIMESTAMP THEN numberOfRequestForDayForHour ELSE 0 END) / 90 AS 'Average Last 90 Days',
	SUM(CASE WHEN requestDay BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 365 DAY) AND CURRENT_TIMESTAMP THEN numberOfRequestForDayForHour ELSE 0 END) / 365 AS 'Average Last 365 Days'
FROM HourlyHistoricalCounts
GROUP BY hourOfDay;






-- Number of Requests for Average Day in Last Day, Last Week, Last Month, Last Quarter, and Last Year
WITH 
TimeFrames AS (
    SELECT
        COUNT(*) AS queryCount,
        CASE 
            WHEN requestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY) AND CURRENT_TIMESTAMP THEN 'Past Day'
            WHEN requestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) AND CURRENT_TIMESTAMP THEN 'Past 7 Days'
            WHEN requestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY) AND CURRENT_TIMESTAMP THEN 'Past 30 Days'
            WHEN requestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY) AND CURRENT_TIMESTAMP THEN 'Past 90 Days'
            WHEN requestDate BETWEEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 365 DAY) AND CURRENT_TIMESTAMP THEN 'Past 365 Days'
        END AS period
    FROM previousRequests
    WHERE requestOriginalURL != '/watchdog'
    GROUP BY period
)
SELECT
    period,
    CASE
        WHEN period = 'Past Day' THEN queryCount
        WHEN period = 'Past 7 Days' THEN queryCount / 7
        WHEN period = 'Past 30 Days' THEN queryCount / 30
        WHEN period = 'Past 90 Days' THEN queryCount / 90
        WHEN period = 'Past 365 Days' THEN queryCount / 365
    END AS 'Queries for Average Day in Period'
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
