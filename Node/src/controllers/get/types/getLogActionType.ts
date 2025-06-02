import { logActionTypeColumns, type LogActionTypeRow } from '../../../main/types/rows/LogActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { CACHE_KEYS, getCached, setCached } from '../../../main/database/databaseCache.js';

async function getAllLogActionTypes(
  databaseConnection: Queryable,
): Promise<LogActionTypeRow[]> {
  const cached = getCached(CACHE_KEYS.LOG_ACTION_TYPES);
  if (cached !== undefined) {
    return cached;
  }

  const logActionTypeRows = await databaseQuery<LogActionTypeRow[]>(
    databaseConnection,
    `SELECT ${logActionTypeColumns}
         FROM logActionType lat`,
  );

  setCached(CACHE_KEYS.LOG_ACTION_TYPES, logActionTypeRows);
  return logActionTypeRows;
}

async function getLogActionTypeForId(
  databaseConnection: Queryable,
  logActionTypeId: number,
): Promise<LogActionTypeRow | undefined> {
  const logActions = await getAllLogActionTypes(databaseConnection);

  const logAction = logActions.find((ra) => ra.logActionTypeId === logActionTypeId);

  return logAction;
}

export { getAllLogActionTypes, getLogActionTypeForId };
