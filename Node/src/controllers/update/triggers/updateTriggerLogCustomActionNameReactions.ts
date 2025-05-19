import { createTriggerLogCustomActionNameReaction } from 'src/controllers/create/triggers/createTriggerLogCustomActionNameReactions.js';
import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { getTriggerLogCustomActionNameReactionsForTriggerUUID } from '../../get/triggers/getTriggerLogCustomActionNameReactions.js';

/**
 *  Queries the database to update a single trigger and its reactions.
 *  Computes diffs rather than deleting all rows.
 */
async function updateTriggerLogCustomNameActionReactionForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetUpdatedDogTriggersRow,
): Promise<void> {
  const newLogCustomActionNames = trigger.logCustomActionNameReactions ?? [];
  const existingLogCustomActionRows = await getTriggerLogCustomActionNameReactionsForTriggerUUID(databaseConnection, trigger.triggerUUID);
  const existingLogCustomActionNames = existingLogCustomActionRows.map((r) => r.logCustomActionName);

  const promises: Promise<unknown>[] = [];

  const toAddNames = newLogCustomActionNames.filter((name) => !existingLogCustomActionNames.includes(name));
  toAddNames.forEach((name) => {
    promises.push(createTriggerLogCustomActionNameReaction(
      databaseConnection,
      {
        triggerUUID: trigger.triggerUUID,
        logCustomActionName: name,
      },
    ));
  });

  const toRemoveNames = existingLogCustomActionNames.filter((name) => !newLogCustomActionNames.includes(name));
  if (toRemoveNames.length > 0) {
    promises.push(
      databaseQuery(
        databaseConnection,
        `DELETE FROM dogTriggersLogCustomActionNameReactions
              WHERE triggerUUID = ? AND logCustomActionName IN (?)`,
        [trigger.triggerUUID, toRemoveNames],
      ),
    );
  }

  await Promise.all(promises);
}

/**
   *  Queries the database to update multiple triggers and their reactions.
   */
async function updateTriggerLogCustomNameActionReactionForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetUpdatedDogTriggersRow[],
): Promise<void> {
  const promises: Promise<void>[] = triggers.map((t) => updateTriggerLogCustomNameActionReactionForTrigger(databaseConnection, t));
  await Promise.all(promises);
}

export { updateTriggerLogCustomNameActionReactionForTrigger, updateTriggerLogCustomNameActionReactionForTriggers };
