-- Total Number of Requests
SELECT COUNT(requestId) AS 'Total Requests' 
FROM previousRequests;



-- Most Recent 100 Requests
SELECT
    pReq.requestUserId,
	pReq.requestDate,
	pReq.requestMethod,
	pReq.requestOriginalURL,
	pReq.requestBody,
	pReq.requestAppVersion,
    pRes.responseStatus,
    pRes.responseBody
FROM previousRequests pReq
LEFT JOIN previousResponses pRes ON pReq.requestId = pRes.requestId
ORDER BY pReq.requestId DESC;



-- Most Recent Custom 100 Requests
SELECT
    pReq.requestUserId,
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
	# requestUserId = "f0e8e3c1b9ac13ef2fa4c5685044eb2ee17c16f1b0b0d90c745acc40e71a5480"
	#AND pReq.requestMethod = "POST"
pReq.requestOriginalURL = "/app/user/family/dogs/logs"
	AND pReq.requestUserId = "f3102b255e71c67322fc3f871b1fa9db3c1ed3d20f0dd12662e95fafac32f699"
ORDER BY pReq.requestId DESC
LIMIT 15;



-- Most Recent 100 Failed Requests
SELECT 
    pReq.requestUserId,
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
	pReq.requestAppVersion IS NOT NULL
	AND pRes.responseStatus NOT BETWEEN 200 AND 299
ORDER BY pReq.requestDate DESC
LIMIT 50;



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
