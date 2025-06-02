import { logUnitTypeColumns, type LogUnitTypeRow } from '../../../main/types/rows/LogUnitTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { CACHE_KEYS, getCached, setCached } from '../../../main/database/databaseCache.js';

async function getAllLogUnitTypes(
  databaseConnection: Queryable,
): Promise<LogUnitTypeRow[]> {
  const cached = getCached(CACHE_KEYS.LOG_UNIT_TYPES);
  if (cached !== undefined) {
    return cached;
  }

  const logUnitTypeRows = await databaseQuery<LogUnitTypeRow[]>(
    databaseConnection,
    `SELECT ${logUnitTypeColumns}
         FROM logUnitType lut`,
  );

  setCached(CACHE_KEYS.LOG_UNIT_TYPES, logUnitTypeRows);
  return logUnitTypeRows;
}

async function getLogUnitTypeForId(
  databaseConnection: Queryable,
  logUnitTypeId: number,
): Promise<LogUnitTypeRow | undefined> {
  const logUnits = await getAllLogUnitTypes(databaseConnection);

  const logUnit = logUnits.find((ra) => ra.logUnitTypeId === logUnitTypeId);

  return logUnit;
}

export { getAllLogUnitTypes, getLogUnitTypeForId };
