import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { type DogTriggersRow, dogTriggersColumns } from '../../../main/types/rows/DogTriggersRow.js';
import { getTriggerLogActionReactionsForTriggerUUID, getTriggerLogActionReactionsForTriggerUUIDs } from './getTriggerLogActionReaction.js';
import { getTriggerLogCustomActionNameReactionsForTriggerUUID, getTriggerLogCustomActionNameReactionsForTriggerUUIDs } from './getTriggerLogCustomActionNameReaction.js';

/**
 * If you are querying a single element from the database, previousTriggerManagerSynchronization is not taken.
 * We always want to fetch the specified element along with its reaction lists.
 */
async function getTriggerForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
  includeDeletedTriggers: boolean,
): Promise<DogTriggersRow | undefined> {
  // Fetch base trigger row
  let triggers = await databaseQuery<DogTriggersRow[]>(
    databaseConnection,
    `SELECT ${dogTriggersColumns}
      FROM dogTriggers dt
      WHERE dt.triggerUUID = ?
      LIMIT 1`,
    [triggerUUID],
  );

  if (includeDeletedTriggers === false) {
    triggers = triggers.filter((possiblyDeletedTrigger) => possiblyDeletedTrigger.triggerIsDeleted === 0);
  }

  const trigger = triggers.safeIndex(0);
  if (trigger === undefined) {
    return undefined;
  }

  // TODO FUTURE instead of making log actions to react to a string, make it a JSON array
  const logActionReactionsRows = await getTriggerLogActionReactionsForTriggerUUID(databaseConnection, trigger.triggerUUID);
  const logCustomActionNameRows = await getTriggerLogCustomActionNameReactionsForTriggerUUID(databaseConnection, trigger.triggerUUID);

  trigger.logActionReactions = logActionReactionsRows.map((r) => r.internalValue);
  trigger.logCustomActionNameReactions = logCustomActionNameRows.map((r) => r.logCustomActionName);

  return trigger;
}

/**
 * If you are querying multiple elements from the database, previousTriggerManagerSynchronization is optionally taken.
 * We don't always want to fetch all the elements as it could be a lot of unnecessary data.
 */
async function getAllTriggersForDogUUID(
  databaseConnection: Queryable,
  dogUUID: string,
  includeDeletedTriggers: boolean,
  previousTriggerManagerSynchronization?: Date,
): Promise<DogTriggersRow[]> {
  // Base fetch
  let triggers = previousTriggerManagerSynchronization !== undefined
    ? await databaseQuery<DogTriggersRow[]>(
      databaseConnection,
      `SELECT ${dogTriggersColumns}
             FROM dogTriggers dt
            WHERE dt.dogUUID = ?
              AND TIMESTAMPDIFF(MICROSECOND, dt.triggerLastModified, ?) <= 0`,
      [dogUUID, previousTriggerManagerSynchronization],
    )
    : await databaseQuery<DogTriggersRow[]>(
      databaseConnection,
      `SELECT ${dogTriggersColumns}
             FROM dogTriggers dt
            WHERE dt.dogUUID = ?`,
      [dogUUID],
    );

  if (includeDeletedTriggers === false) {
    triggers = triggers.filter((possiblyDeletedTriggers) => possiblyDeletedTriggers.triggerIsDeleted === 0);
  }

  const triggerUUIDs = triggers.map((t) => t.triggerUUID);

  if (triggerUUIDs.length === 0) {
    return triggers;
  }

  const logActionReactionsRows = await getTriggerLogActionReactionsForTriggerUUIDs(databaseConnection, triggerUUIDs);
  const logCustomActionNameRows = await getTriggerLogCustomActionNameReactionsForTriggerUUIDs(databaseConnection, triggerUUIDs);

  triggers.forEach((trigger) => {
    const updatedTrigger = { ...trigger };
    updatedTrigger.logActionReactions = logActionReactionsRows.filter((r) => r.triggerUUID === trigger.triggerUUID).map((r) => r.internalValue);
    updatedTrigger.logCustomActionNameReactions = logCustomActionNameRows.filter((r) => r.triggerUUID === trigger.triggerUUID).map((r) => r.logCustomActionName);
    Object.assign(trigger, updatedTrigger);
  });

  return triggers;
}

export { getTriggerForTriggerUUID, getAllTriggersForDogUUID };
