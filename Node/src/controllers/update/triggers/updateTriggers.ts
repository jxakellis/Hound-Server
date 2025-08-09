import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/rows/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { updateTriggerLogReactionForTrigger } from './updateTriggerLogReaction.js';
import { updateTriggerReminderResultForTrigger } from './updateTriggerReminderResult.js';
import { updateTriggerActivationForTrigger } from './updateTriggerActivation.js';

/**
 *  Queries the database to update a single trigger and its reactions.
 *  Computes diffs rather than deleting all rows.
 */
async function updateTriggerForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetUpdatedDogTriggersRow,
): Promise<void> {
  const promises: Promise<unknown>[] = [];

  promises.push(
    databaseQuery(
      databaseConnection,
      `UPDATE dogTriggers
           SET triggerType                  = ?,
               triggerTimeDelay             = ?,
               triggerFixedTimeType         = ?,
               triggerFixedTimeTypeAmount   = ?,
               triggerFixedTimeHour      = ?,
               triggerFixedTimeMinute    = ?,
               triggerManualCondition       = ?,
               triggerAlarmCreatedCondition = ?,
               triggerLastModified          = CURRENT_TIMESTAMP(),
               triggerLastModifiedBy        = ?
         WHERE triggerUUID = ?`,
      [
        trigger.triggerType,
        trigger.triggerTimeDelay,
        trigger.triggerFixedTimeType,
        trigger.triggerFixedTimeTypeAmount,
        trigger.triggerFixedTimeHour,
        trigger.triggerFixedTimeMinute,
        trigger.triggerManualCondition,
        trigger.triggerAlarmCreatedCondition,
        trigger.triggerLastModifiedBy,
        trigger.triggerUUID,
      ],
    ),
    updateTriggerLogReactionForTrigger(databaseConnection, trigger),
    updateTriggerReminderResultForTrigger(databaseConnection, trigger),
    updateTriggerActivationForTrigger(databaseConnection, trigger),
  );

  await Promise.all(promises);
}

/**
   *  Queries the database to update multiple triggers and their reactions.
   */
async function updateTriggersForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetUpdatedDogTriggersRow[],
): Promise<void> {
  const promises: Promise<void>[] = triggers.map((t) => updateTriggerForTrigger(databaseConnection, t));
  await Promise.all(promises);
}

export { updateTriggerForTrigger, updateTriggersForTriggers };
