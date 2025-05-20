import { logActionTypeColumns, type LogActionTypeRow, type LogActionTypeRowWithMapping } from '../../../main/types/rows/LogActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { getAllMappingLogActionTypeReminderActionType } from './getMappingLogActionTypeReminderActionType.js';

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
         FROM logActionType lat
        WHERE internalValue IN (?)`,
    [internalValues],
  );

  const map = new Map<string, number>();
  logActionTypeRows.forEach((logActionTypeRow) => map.set(logActionTypeRow.internalValue, logActionTypeRow.logActionTypeId));
  return map;
}

async function getAllLogActionTypes(
  databaseConnection: Queryable,
): Promise<LogActionTypeRow[]> {
  const logActionTypeRows = await databaseQuery<LogActionTypeRow[]>(
    databaseConnection,
    `SELECT ${logActionTypeColumns}
         FROM logActionType lat`,
  );

  return logActionTypeRows;
}

async function getAllLogActionTypesWithMappings(
  databaseConnection: Queryable,
): Promise<LogActionTypeRowWithMapping[]> {
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

  return logActionTypeRowsWithMappings;
}

export { getLogActionTypeMap, getAllLogActionTypes, getAllLogActionTypesWithMappings };
