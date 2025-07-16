import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogTriggerLogReactionColumns, type DogTriggerLogReactionRow } from '../../../main/types/rows/DogTriggerLogReactionRow.js';

async function getTriggerLogReactionsForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<DogTriggerLogReactionRow[]> {
  return databaseQuery<DogTriggerLogReactionRow[]>(
    databaseConnection,
    `SELECT ${dogTriggerLogReactionColumns}
           FROM dogTriggerLogReaction dtlr
          WHERE dtlr.triggerUUID = ?
          LIMIT 18446744073709551615`,
    [triggerUUID],
  );
}

async function getTriggerLogReactionsForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<(DogTriggerLogReactionRow)[]> {
  return databaseQuery<(
DogTriggerLogReactionRow)[]>(
    databaseConnection,
    `SELECT ${dogTriggerLogReactionColumns}
             FROM dogTriggerLogReaction dtlr
            WHERE dtlr.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
    );
}

export { getTriggerLogReactionsForTriggerUUID, getTriggerLogReactionsForTriggerUUIDs };
