import { createTriggerReminderResult } from '../../create/triggers/createTriggerReminderResult.js';
import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/rows/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { getTriggerReminderResultForTriggerUUID } from '../../get/triggers/getTriggerReminderResult.js';

/**
*  Queries the database to update a single trigger and its reminder result.
*  Computes diffs rather than deleting all rows.
*/
async function updateTriggerReminderResultForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetUpdatedDogTriggersRow,
): Promise<void> {
  const existingReminderResult = await getTriggerReminderResultForTriggerUUID(databaseConnection, trigger.triggerUUID);
  const newReminderResult = trigger.triggerReminderResult;

  // Helper to create a comparable key
  function reactionKey(r: { reminderActionTypeId: number; reminderCustomActionName?: string }): string {
    return `${r.reminderActionTypeId}:${r.reminderCustomActionName ?? ''}`;
  }

  if (existingReminderResult === undefined) {
    await createTriggerReminderResult(databaseConnection, {
      triggerUUID: trigger.triggerUUID,
      reminderActionTypeId: newReminderResult.reminderActionTypeId,
      reminderCustomActionName: newReminderResult.reminderCustomActionName,
    });
    return;
  }

  if (reactionKey(newReminderResult) !== reactionKey(existingReminderResult)) {
    await databaseQuery(
      databaseConnection,
      'DELETE FROM dogTriggerReminderResult WHERE triggerUUID = ? AND reminderActionTypeId = ? AND reminderCustomActionName = ?',
      [trigger.triggerUUID, existingReminderResult.reminderActionTypeId, existingReminderResult.reminderCustomActionName],
    );
    await createTriggerReminderResult(databaseConnection, {
      triggerUUID: trigger.triggerUUID,
      reminderActionTypeId: newReminderResult.reminderActionTypeId,
      reminderCustomActionName: newReminderResult.reminderCustomActionName,
    });
  }
}

/**
*  Queries the database to update multiple triggers and their reactions.
*/
async function updateTriggerReminderResultForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetUpdatedDogTriggersRow[],
): Promise<void> {
  const promises: Promise<void>[] = triggers.map((t) => updateTriggerReminderResultForTrigger(databaseConnection, t));
  await Promise.all(promises);
}

export { updateTriggerReminderResultForTrigger, updateTriggerReminderResultForTriggers };
