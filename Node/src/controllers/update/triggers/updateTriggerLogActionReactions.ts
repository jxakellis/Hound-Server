import { createTriggerLogActionReaction } from '../../../controllers/create/triggers/createTriggerLogActionReactions.js';
import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/rows/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { getLogActionTypeMap } from '../../get/types/getLogActionType.js';
import { getTriggerLogActionReactionsForTriggerUUID } from '../../get/triggers/getTriggerLogActionReaction.js';

/**
 *  Queries the database to update a single trigger and its reactions.
 *  Computes diffs rather than deleting all rows.
 */
async function updateTriggerLogActionReactionForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetUpdatedDogTriggersRow,
): Promise<void> {
  const logActionTypeMap = await getLogActionTypeMap(databaseConnection, trigger.logActionReactions ?? []);
  const existingLogActionTypes = await getTriggerLogActionReactionsForTriggerUUID(databaseConnection, trigger.triggerUUID);

  const newLogActionTypeIds = (trigger.logActionReactions ?? []).map((internal) => logActionTypeMap.get(internal)).filter((id): id is number => id !== undefined);
  const existingLogActionTypeIds = existingLogActionTypes.map((r) => r.logActionTypeId);

  const promises: Promise<unknown>[] = [];

  const toAddTypeIds = newLogActionTypeIds.filter((id) => !existingLogActionTypeIds.includes(id));
  toAddTypeIds.forEach((logActionTypeId) => {
    promises.push(createTriggerLogActionReaction(databaseConnection, { triggerUUID: trigger.triggerUUID, logActionTypeId }));
  });

  const toRemoveTypeIds = existingLogActionTypeIds.filter((id) => !newLogActionTypeIds.includes(id));
  if (toRemoveTypeIds.length > 0) {
    promises.push(
      databaseQuery(
        databaseConnection,
        `DELETE FROM dogTriggerLogActionReaction
              WHERE triggerUUID = ? AND logActionTypeId IN (?)`,
        [trigger.triggerUUID, toRemoveTypeIds],
      ),
    );
  }

  await Promise.all(promises);
}

/**
   *  Queries the database to update multiple triggers and their reactions.
   */
async function updateTriggerLogActionReactionForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetUpdatedDogTriggersRow[],
): Promise<void> {
  const promises: Promise<void>[] = triggers.map((t) => updateTriggerLogActionReactionForTrigger(databaseConnection, t));
  await Promise.all(promises);
}

export { updateTriggerLogActionReactionForTrigger, updateTriggerLogActionReactionForTriggers };
