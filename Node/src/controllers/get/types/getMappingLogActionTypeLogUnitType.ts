import { mappingLogActionTypeLogUnitTypeColumns, type MappingLogActionTypeLogUnitTypeRow } from 'src/main/types/rows/MappingLogActionTypeLogUnitTypeRow.js';
import { CACHE_KEYS, getCached, setCached } from '../../../main/database/databaseCache.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function getAllMappingLogActionTypeLogUnitType(
  databaseConnection: Queryable,
): Promise<MappingLogActionTypeLogUnitTypeRow[]> {
  const cached = getCached(CACHE_KEYS.MAPPING_LOG_ACTION_LOG_UNIT_TYPES);
  if (cached !== undefined) {
    return cached;
  }

  const mappingLogActionTypeLogUnitTypeRows = await databaseQuery<MappingLogActionTypeLogUnitTypeRow[]>(
    databaseConnection,
    `SELECT ${mappingLogActionTypeLogUnitTypeColumns}
         FROM mappingLogActionTypeLogUnitType mlatlut`,
  );

  setCached(CACHE_KEYS.MAPPING_LOG_ACTION_LOG_UNIT_TYPES, mappingLogActionTypeLogUnitTypeRows);

  return mappingLogActionTypeLogUnitTypeRows;
}

export { getAllMappingLogActionTypeLogUnitType };
