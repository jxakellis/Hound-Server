import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogTriggersLogCustomActionNameReactionsColumns, type DogTriggersLogCustomActionNameReactionsRow } from '../../../main/types/DogTriggersLogCustomActionNameReactions.js';

async function getTriggerLogCustomActionNameReactionsForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<DogTriggersLogCustomActionNameReactionsRow[]> {
  return databaseQuery<DogTriggersLogCustomActionNameReactionsRow[]>(
    databaseConnection,
    `SELECT ${dogTriggersLogCustomActionNameReactionsColumns}
       FROM dogTriggersLogCustomActionNameReactions dtlcanr
      WHERE dtlcanr.triggerUUID = ?
      LIMIT 18446744073709551615`,
    [triggerUUID],
  );
}

async function getTriggerLogCustomActionNameReactionsForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<DogTriggersLogCustomActionNameReactionsRow[]> {
  return databaseQuery<DogTriggersLogCustomActionNameReactionsRow[]>(
    databaseConnection,
    `SELECT ${dogTriggersLogCustomActionNameReactionsColumns}
       FROM dogTriggersLogCustomActionNameReactions dtlcanr
            WHERE dtlcanr.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
  );
}

export { getTriggerLogCustomActionNameReactionsForTriggerUUID, getTriggerLogCustomActionNameReactionsForTriggerUUIDs };
