import { CACHE_KEYS, getCached, setCached } from '../../../main/database/databaseCache.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { mappingLogActionTypeReminderActionTypeColumns, type MappingLogActionTypeReminderActionTypeRow } from '../../../main/types/rows/MappingLogActionTypeReminderActionTypeRow.js';

async function getAllMappingLogActionTypeReminderActionType(
  databaseConnection: Queryable,
): Promise<MappingLogActionTypeReminderActionTypeRow[]> {
  const cached = getCached(CACHE_KEYS.MAPPING_LOG_ACTION_REMINDER_ACTION_TYPES);
  if (cached !== undefined) {
    return cached;
  }

  const mappingLogActionTypeReminderActionTypeRows = await databaseQuery<MappingLogActionTypeReminderActionTypeRow[]>(
    databaseConnection,
    `SELECT ${mappingLogActionTypeReminderActionTypeColumns}
         FROM mappingLogActionTypeReminderActionType mlatrat`,
  );

  setCached(CACHE_KEYS.MAPPING_LOG_ACTION_REMINDER_ACTION_TYPES, mappingLogActionTypeReminderActionTypeRows);

  return mappingLogActionTypeReminderActionTypeRows;
}

export { getAllMappingLogActionTypeReminderActionType };
