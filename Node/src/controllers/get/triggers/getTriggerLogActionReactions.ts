import { dogTriggersLogActionReactionsColumns, type DogTriggersLogActionReactionsRow } from '../../../main/types/DogTriggersLogActionReactionsRow.js';
import { logActionTypeColumns, type LogActionTypeRow } from '../../../main/types/LogActionTypeRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';

async function getTriggerLogActionReactionsForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<LogActionTypeRow[]> {
  return databaseQuery<LogActionTypeRow[]>(
    databaseConnection,
    `SELECT ${logActionTypeColumns}
           FROM dogTriggersLogActionReactions dtlar
           JOIN logActionTypes lat ON dtlar.logActionTypeId = lat.logActionTypeId
          WHERE dtlar.triggerUUID = ?
          LIMIT 18446744073709551615`,
    [triggerUUID],
  );
}

async function getTriggerLogActionReactionsForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<(
    DogTriggersLogActionReactionsRow & LogActionTypeRow)[]> {
  return databaseQuery<(
        DogTriggersLogActionReactionsRow & LogActionTypeRow)[]>(
    databaseConnection,
    `SELECT ${dogTriggersLogActionReactionsColumns}, ${logActionTypeColumns}
             FROM dogTriggersLogActionReactions dtlar
             JOIN logActionTypes lat ON dtlar.logActionTypeId = lat.logActionTypeId
            WHERE dtlar.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
    );
}

export { getTriggerLogActionReactionsForTriggerUUID, getTriggerLogActionReactionsForTriggerUUIDs };
