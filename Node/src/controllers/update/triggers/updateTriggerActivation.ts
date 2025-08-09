import { type NotYetUpdatedDogTriggersRow } from '../../../main/types/rows/DogTriggersRow.js';
import { type Queryable } from '../../../main/database/databaseQuery.js';
import { getTriggerActivationsForTriggerUUID } from '../../get/triggers/getTriggerActivation.js';
import { createSingleTriggerActivation } from '../../create/triggers/createTriggerActivation.js';

/**
*  Queries the database to update a single trigger and its reactions.
*  Computes diffs rather than deleting all rows.
*/
async function updateTriggerActivationForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetUpdatedDogTriggersRow,
): Promise<void> {
  // DONT allow deletion of activations, only the addition of them
  const existingActivations = await getTriggerActivationsForTriggerUUID(databaseConnection, trigger.triggerUUID);
  const newActivations = trigger.triggerActivations;

  // TODO TEST that this iso comparison btn date from front end to backend words
  function activationKey(activation: { activationDate: Date }): string {
    return activation.activationDate.toISOString();
  }

  const existingKeys = existingActivations.map(activationKey);
  console.info('newActivations:', newActivations, 'existingKeys', existingKeys);

  const toAddActivations = newActivations.filter((newActivation) => !existingKeys.includes(activationKey(newActivation)));

  const promises: Promise<unknown>[] = [];

  toAddActivations.forEach((toAddActivation) => {
    promises.push(createSingleTriggerActivation(databaseConnection, {
      triggerUUID: trigger.triggerUUID,
      activationDate: toAddActivation.activationDate,
    }));
  });

  await Promise.all(promises);
}

/**
*  Queries the database to update multiple triggers and their reactions.
*/
async function updateTriggerActivationForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetUpdatedDogTriggersRow[],
): Promise<void> {
  const promises: Promise<void>[] = triggers.map((t) => updateTriggerActivationForTrigger(databaseConnection, t));
  await Promise.all(promises);
}

export { updateTriggerActivationForTrigger, updateTriggerActivationForTriggers };
