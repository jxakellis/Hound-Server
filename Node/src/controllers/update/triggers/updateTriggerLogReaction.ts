import { createTriggerLogReaction } from '../../create/triggers/createTriggerLogReaction.js';
import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/rows/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { getTriggerLogReactionsForTriggerUUID } from '../../get/triggers/getTriggerLogReaction.js';

/**
*  Queries the database to update a single trigger and its reactions.
*  Computes diffs rather than deleting all rows.
*/
async function updateTriggerLogReactionForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetUpdatedDogTriggersRow,
): Promise<void> {
  const existingLogReactions = await getTriggerLogReactionsForTriggerUUID(databaseConnection, trigger.triggerUUID);
  const newLogReactions = trigger.triggerLogReactions;

  function reactionKey(r: { logActionTypeId: number; logCustomActionName: string }): string {
    return `${r.logActionTypeId}:${r.logCustomActionName}`;
  }

  const newKeys = newLogReactions.map(reactionKey);
  const existingKeys = existingLogReactions.map(reactionKey);

  const toAddLogReactions = newLogReactions.filter((r) => !existingKeys.includes(reactionKey(r)));
  const toRemoveLogReactions = existingLogReactions.filter((r) => !newKeys.includes(reactionKey(r)));

  const promises: Promise<unknown>[] = [];

  toAddLogReactions.forEach((toAddLogReaction) => {
    promises.push(createTriggerLogReaction(databaseConnection, {
      triggerUUID: trigger.triggerUUID,
      logActionTypeId: toAddLogReaction.logActionTypeId,
      logCustomActionName: toAddLogReaction.logCustomActionName,
    }));
  });

  toRemoveLogReactions.forEach((toRemoveLogReaction) => {
    promises.push(
      databaseQuery(
        databaseConnection,
        `DELETE dogTriggerLogReaction
              WHERE triggerUUID = ? AND logActionTypeId = ? AND logCustomActionName = ?`,
        [trigger.triggerUUID, toRemoveLogReaction.logActionTypeId, toRemoveLogReaction.logCustomActionName],
      ),
    );
  });

  await Promise.all(promises);
}

/**
*  Queries the database to update multiple triggers and their reactions.
*/
async function updateTriggerLogReactionForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetUpdatedDogTriggersRow[],
): Promise<void> {
  const promises: Promise<void>[] = triggers.map((t) => updateTriggerLogReactionForTrigger(databaseConnection, t));
  await Promise.all(promises);
}

export { updateTriggerLogReactionForTrigger, updateTriggerLogReactionForTriggers };
