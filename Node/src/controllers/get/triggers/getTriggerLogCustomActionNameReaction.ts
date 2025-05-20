import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogTriggerLogCustomActionNameReactionColumns, type DogTriggerLogCustomActionNameReactionRow } from '../../../main/types/rows/DogTriggerLogCustomActionNameReactionRow.js';

async function getTriggerLogCustomActionNameReactionsForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<DogTriggerLogCustomActionNameReactionRow[]> {
  return databaseQuery<DogTriggerLogCustomActionNameReactionRow[]>(
    databaseConnection,
    `SELECT ${dogTriggerLogCustomActionNameReactionColumns}
       FROM dogTriggerLogCustomActionNameReaction dtlcanr
      WHERE dtlcanr.triggerUUID = ?
      LIMIT 18446744073709551615`,
    [triggerUUID],
  );
}

async function getTriggerLogCustomActionNameReactionsForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<DogTriggerLogCustomActionNameReactionRow[]> {
  return databaseQuery<DogTriggerLogCustomActionNameReactionRow[]>(
    databaseConnection,
    `SELECT ${dogTriggerLogCustomActionNameReactionColumns}
       FROM dogTriggerLogCustomActionNameReaction dtlcanr
            WHERE dtlcanr.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
  );
}

export { getTriggerLogCustomActionNameReactionsForTriggerUUID, getTriggerLogCustomActionNameReactionsForTriggerUUIDs };
