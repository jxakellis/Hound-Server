import { reminderActionTypeColumns, type ReminderActionTypeRow } from '../../../main/types/rows/ReminderActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function getReminderActionTypeMap(
  databaseConnection: Queryable,
  internalValues: string[],
): Promise<Map<string, number>> {
  if (internalValues.length === 0) {
    return new Map();
  }

  const reminderActionTypeRows = await databaseQuery<ReminderActionTypeRow[]>(
    databaseConnection,
    `SELECT ${reminderActionTypeColumns}
         FROM reminderActionType lat
        WHERE internalValue IN (?)`,
    [internalValues],
  );

  const map = new Map<string, number>();
  reminderActionTypeRows.forEach((reminderActionTypeRow) => map.set(reminderActionTypeRow.internalValue, reminderActionTypeRow.reminderActionTypeId));
  return map;
}

async function getAllReminderActionTypes(
  databaseConnection: Queryable,
): Promise<ReminderActionTypeRow[]> {
  const reminderActionTypeRows = await databaseQuery<ReminderActionTypeRow[]>(
    databaseConnection,
    `SELECT ${reminderActionTypeColumns}
         FROM reminderActionType lat`,
  );

  return reminderActionTypeRows;
}

export { getReminderActionTypeMap, getAllReminderActionTypes };
