import { CACHE_KEYS, getCached, setCached } from '../../../main/database/databaseCache.js';
import { reminderActionTypeColumns, type ReminderActionTypeRow } from '../../../main/types/rows/ReminderActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function getAllReminderActionTypes(
  databaseConnection: Queryable,
): Promise<ReminderActionTypeRow[]> {
  const cached = getCached(CACHE_KEYS.REMINDER_ACTION_TYPES);
  if (cached !== undefined) {
    return cached;
  }

  const reminderActionTypeRows = await databaseQuery<ReminderActionTypeRow[]>(
    databaseConnection,
    `SELECT ${reminderActionTypeColumns}
         FROM reminderActionType lat`,
  );

  setCached(CACHE_KEYS.REMINDER_ACTION_TYPES, reminderActionTypeRows);

  return reminderActionTypeRows;
}

export { getAllReminderActionTypes };
