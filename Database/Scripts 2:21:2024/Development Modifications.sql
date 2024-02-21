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
	1=1
    # AND pReq.requestAppVersion != '3.0.1'
	# AND pRes.responseStatus != 200
	# AND (pReq.requestUserId IS NULL OR pReq.requestUserId != 'd7a178f103d6f5d05dc61e37b52e9a2e99a2e14392d22b1d22b506c3b7d21273')
    # pReq.requestOriginalURL LIKE '%ba10953a9e559a58ce979afa3f71f23b2e1974c19aa96dd8efe52a6453bb6371%'
	#AND pReq.requestId > (1128328 - 15)
	#AND pReq.requestId < (1128328 + 15)
ORDER BY pReq.requestId DESC
LIMIT 100;