import { logActionTypeColumns, type LogActionTypeRow } from '../../../main/types/rows/LogActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogTriggerLogActionReactionColumns, type DogTriggerLogActionReactionRow } from '../../../main/types/rows/DogTriggerLogActionReactionRow.js';

async function getTriggerLogActionReactionsForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<LogActionTypeRow[]> {
  return databaseQuery<LogActionTypeRow[]>(
    databaseConnection,
    `SELECT ${logActionTypeColumns}
           FROM dogTriggerLogActionReaction dtlar
           JOIN logActionType lat ON dtlar.logActionTypeId = lat.logActionTypeId
          WHERE dtlar.triggerUUID = ?
          LIMIT 18446744073709551615`,
    [triggerUUID],
  );
}

async function getTriggerLogActionReactionsForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<(
    DogTriggerLogActionReactionRow & LogActionTypeRow)[]> {
  return databaseQuery<(
        DogTriggerLogActionReactionRow & LogActionTypeRow)[]>(
    databaseConnection,
    `SELECT ${dogTriggerLogActionReactionColumns}, ${logActionTypeColumns}
             FROM dogTriggerLogActionReaction dtlar
             JOIN logActionType lat ON dtlar.logActionTypeId = lat.logActionTypeId
            WHERE dtlar.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
    );
}

export { getTriggerLogActionReactionsForTriggerUUID, getTriggerLogActionReactionsForTriggerUUIDs };
