import { type NotYetCreatedDogTriggersRow } from '../../../main/types/rows/DogTriggersRow.js';

import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import { LIMIT } from '../../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../../main/server/globalErrors.js';
import { getAllTriggersForDogUUID } from '../../../controllers/get/triggers/getTriggers.js';
import { createTriggerReminderResult } from './createTriggerReminderResult.js';
import { createSingleTriggerLogReaction } from './createTriggerLogReaction.js';
import { createSingleTriggerActivation } from './createTriggerActivation.js';

/**
*  Queries the database to create a single trigger. If the query is successful, then returns the trigger with created triggerId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createTriggerForTrigger(
  databaseConnection: Queryable,
  trigger: NotYetCreatedDogTriggersRow,
): Promise<number> {
  const notDeletedTriggers = await getAllTriggersForDogUUID(databaseConnection, trigger.dogUUID, false, undefined);

  // make sure that the user isn't creating too many triggers
  if (notDeletedTriggers.length >= LIMIT.NUMBER_OF_TRIGGERS_PER_DOG) {
    throw new HoundError(`Dog trigger limit of ${LIMIT.NUMBER_OF_TRIGGERS_PER_DOG} exceeded`, createTriggerForTrigger, ERROR_CODES.FAMILY.LIMIT.TRIGGER_TOO_LOW);
  }

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogTriggers(
          dogUUID,
          triggerUUID,
          triggerType,
          triggerTimeDelay,
          triggerFixedTimeType, triggerFixedTimeTypeAmount, triggerFixedTimeHour, triggerFixedTimeMinute,
          triggerManualCondition, triggerAlarmCreatedCondition,
          triggerCreated, triggerCreatedBy,
          triggerIsDeleted
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?, ?, ?, ?,
            ?, ?,
            CURRENT_TIMESTAMP(), ?,
            0
            )`,
    [
      trigger.dogUUID,
      trigger.triggerUUID,
      trigger.triggerType,
      trigger.triggerTimeDelay,
      trigger.triggerFixedTimeType, trigger.triggerFixedTimeTypeAmount, trigger.triggerFixedTimeHour, trigger.triggerFixedTimeMinute,
      trigger.triggerManualCondition, trigger.triggerAlarmCreatedCondition,
      trigger.triggerCreatedBy,
    ],
  );

  const promises: Promise<unknown>[] = [];

  trigger.triggerLogReactions?.forEach((triggerLogReaction) => {
    promises.push(createSingleTriggerLogReaction(
      databaseConnection,
      {
        triggerUUID: trigger.triggerUUID,
        logActionTypeId: triggerLogReaction.logActionTypeId,
        logCustomActionName: triggerLogReaction.logCustomActionName,
      },
    ));
  });

  promises.push(createTriggerReminderResult(databaseConnection, {
    triggerUUID: trigger.triggerUUID,
    reminderActionTypeId: trigger.triggerReminderResult.reminderActionTypeId,
    reminderCustomActionName: trigger.triggerReminderResult.reminderCustomActionName,
  }));

  trigger.triggerActivations?.forEach((triggerActivation) => {
    promises.push(createSingleTriggerActivation(databaseConnection, {
      triggerUUID: trigger.triggerUUID,
      activationDate: triggerActivation.activationDate,
    }));
  });

  await Promise.all(promises);

  return result.insertId;
}

/**
          * Queries the database to create a multiple triggers. If the query is successful, then returns the triggers with their created triggerIds added to them.
          *  If a problem is encountered, creates and throws custom error
          */
async function createTriggersForTriggers(
  databaseConnection: Queryable,
  triggers: NotYetCreatedDogTriggersRow[],
): Promise<number[]> {
  const promises: Promise<number>[] = [];
  triggers.forEach((trigger) => {
    // retrieve the original provided body AND the created id
    promises.push(createTriggerForTrigger(
      databaseConnection,
      trigger,
    ));
  });

  const triggerIds = await Promise.all(promises);

  return triggerIds;
}

export { createTriggersForTriggers };
