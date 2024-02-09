-- Size of each table and MB usage per row
WITH castedUnsignedTableInformation AS (
	SELECT
		CAST(t.DATA_LENGTH AS SIGNED) AS signedDataLength,
		CAST(t.INDEX_LENGTH AS SIGNED) AS signedIndexLength,
		CAST(t.DATA_FREE AS SIGNED) AS signedDataFree,
		t.*
	FROM information_schema.TABLES AS t
	WHERE t.TABLE_SCHEMA != 'information_schema'
   		AND t.TABLE_SCHEMA != 'performance_schema'
   		AND t.TABLE_SCHEMA != 'mysql'
   		AND t.TABLE_SCHEMA != 'sys'
),
tableMetrics AS (
	SELECT
		CASE 
			WHEN t.TABLE_ROWS <= 100 THEN NULL 
			ELSE ((t.signedDataLength + t.signedIndexLength) / 1024 / 1024)
		END AS usedSizeMB,
		CASE 
			WHEN t.TABLE_ROWS <= 100 THEN NULL
			ELSE ((t.signedDataLength + t.signedIndexLength + t.signedDataFree) / 1024 / 1024)
		END AS allocatedSizeMB,
		CASE 
			WHEN t.TABLE_ROWS <= 100 THEN NULL 
			ELSE t.TABLE_ROWS
		END AS numberOfRows,
		t.*
	FROM castedUnsignedTableInformation t
)
SELECT 
	t.TABLE_NAME AS "Table",
	t.numberOfRows AS "Number of Rows",
	ROUND(t.usedSizeMB, 2) AS "Used Size (MB)",
	ROUND((t.usedSizeMB / t.numberOfRows) * 1000000) AS "Avg. Used MB Per 1M Rows",
	ROUND(t.allocatedSizeMB, 2) AS "Allocated Size (MB)",
	ROUND((t.allocatedSizeMB / t.numberOfRows) * 1000000) AS "Avg. Allocated MB Per 1M Rows",
	t.*
FROM tableMetrics t;