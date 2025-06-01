import { logActionTypeColumns, type LogActionTypeRow, type LogActionTypeRowWithMapping } from '../../../main/types/rows/LogActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { getAllMappingLogActionTypeReminderActionType } from './getMappingLogActionTypeReminderActionType.js';
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

async function getAllLogActionTypesWithMappings(
  databaseConnection: Queryable,
): Promise<LogActionTypeRowWithMapping[]> {
  const cached = getCached(CACHE_KEYS.LOG_ACTION_TYPE_WITH_MAPPING);
  if (cached !== undefined) {
    return cached;
  }

  const logActionTypeRows = await getAllLogActionTypes(databaseConnection);

  const mappings = await getAllMappingLogActionTypeReminderActionType(databaseConnection);

  const logActionTypeRowsWithMappings = logActionTypeRows.map((logActionTypeRow) => {
    const linkedReminderActionTypeIds = mappings
      .filter((mapping) => mapping.logActionTypeId === logActionTypeRow.logActionTypeId)
      .map((mapping) => mapping.reminderActionTypeId);

    return {
      ...logActionTypeRow,
      linkedReminderActionTypeIds,
    };
  });

  setCached(CACHE_KEYS.LOG_ACTION_TYPE_WITH_MAPPING, logActionTypeRowsWithMappings);

  return logActionTypeRowsWithMappings;
}

export { getAllLogActionTypes, getLogActionTypeForId, getAllLogActionTypesWithMappings };
