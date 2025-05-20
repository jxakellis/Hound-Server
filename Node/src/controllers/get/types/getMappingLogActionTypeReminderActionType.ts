import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { mappingLogActionTypeReminderActionTypeColumns, type MappingLogActionTypeReminderActionTypeRow } from '../../../main/types/rows/MappingLogActionTypeReminderActionTypeRow.js';

async function getAllMappingLogActionTypeReminderActionType(
  databaseConnection: Queryable,
): Promise<MappingLogActionTypeReminderActionTypeRow[]> {
  const mappingLogActionTypeReminderActionTypeRows = await databaseQuery<MappingLogActionTypeReminderActionTypeRow[]>(
    databaseConnection,
    `SELECT ${mappingLogActionTypeReminderActionTypeColumns}
         FROM mappingLogActionTypeReminderActionType mlatrat`,
  );

  return mappingLogActionTypeReminderActionTypeRows;
}

export { getAllMappingLogActionTypeReminderActionType };
