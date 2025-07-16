import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogTriggerReminderResultColumns, type DogTriggerReminderResultRow } from '../../../main/types/rows/DogTriggerReminderResultRow.js';

async function getTriggerReminderResultForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<DogTriggerReminderResultRow | undefined> {
  const result = await databaseQuery<DogTriggerReminderResultRow[]>(
    databaseConnection,
    `SELECT ${dogTriggerReminderResultColumns}
           FROM dogTriggerReminderResult dtrr
          WHERE dtrr.triggerUUID = ?
          LIMIT 1`,
    [triggerUUID],
  );

  return result.safeIndex(0);
}

async function getTriggerReminderResultForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<(DogTriggerReminderResultRow)[]> {
  return databaseQuery<(
DogTriggerReminderResultRow)[]>(
    databaseConnection,
    `SELECT ${dogTriggerReminderResultColumns}
             FROM dogTriggerReminderResult dtrr
            WHERE dtrr.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
    );
}

export { getTriggerReminderResultForTriggerUUID, getTriggerReminderResultForTriggerUUIDs };
