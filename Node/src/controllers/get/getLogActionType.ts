import { logActionTypeColumns, type LogActionTypeRow } from '../../main/types/LogActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

async function getLogActionTypeMap(
  databaseConnection: Queryable,
  internalValues: string[],
): Promise<Map<string, number>> {
  if (internalValues.length === 0) {
    return new Map();
  }

  const logActionTypeRows = await databaseQuery<LogActionTypeRow[]>(
    databaseConnection,
    `SELECT ${logActionTypeColumns}
         FROM logActionTypes lat
        WHERE internalValue IN (?)`,
    [internalValues],
  );

  const map = new Map<string, number>();
  logActionTypeRows.forEach((logActionTypeRow) => map.set(logActionTypeRow.internalValue, logActionTypeRow.logActionTypeId));
  return map;
}

export { getLogActionTypeMap };
