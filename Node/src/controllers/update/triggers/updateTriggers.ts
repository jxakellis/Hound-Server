import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/DogTriggersRow.js';
import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { formatKnownString } from '../../../main/format/formatObject.js';
import { updateTriggerLogCustomNameActionReactionForTrigger } from './updateTriggerLogCustomActionNameReactions.js';
import { updateTriggerLogActionReactionForTrigger } from './updateTriggerLogActionReactions.js';

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
           SET triggerCustomName         = ?,
               triggerType               = ?,
               triggerTimeDelay          = ?,
               triggerFixedTimeType      = ?,
               triggerFixedTimeTypeAmount= ?,
               triggerFixedTimeUTCHour   = ?,
               triggerFixedTimeUTCMinute = ?,
               triggerLastModified       = CURRENT_TIMESTAMP()
         WHERE triggerUUID = ?`,
      [
        formatKnownString(trigger.triggerCustomName, 32),
        trigger.triggerType,
        trigger.triggerTimeDelay,
        trigger.triggerFixedTimeType,
        trigger.triggerFixedTimeTypeAmount,
        trigger.triggerFixedTimeUTCHour,
        trigger.triggerFixedTimeUTCMinute,
        trigger.triggerUUID,
      ],
    ),
    updateTriggerLogCustomNameActionReactionForTrigger(databaseConnection, trigger),
    updateTriggerLogActionReactionForTrigger(databaseConnection, trigger),
  );

  Promise.all(promises);
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
