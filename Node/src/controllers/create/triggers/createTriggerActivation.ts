import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import type { NotYetCreatedDogTriggerActivationRow } from '../../../main/types/rows/DogTriggerActivationRow.js';

/**
*  Queries the database to create a single trigger. If the query is successful, then returns the trigger with created triggerId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createSingleTriggerActivation(
  databaseConnection: Queryable,
  activation: NotYetCreatedDogTriggerActivationRow,
): Promise<number> {
  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogTriggerActivation(triggerUUID, activationDate) VALUES (?, ?)',
    [
      activation.triggerUUID,
      activation.activationDate,
    ],
  );

  return result.insertId;
}

/**
          * Queries the database to create a multiple triggers. If the query is successful, then returns the triggers with their created triggerIds added to them.
          *  If a problem is encountered, creates and throws custom error
          */
async function createMultipleTriggerActivations(
  databaseConnection: Queryable,
  activations: NotYetCreatedDogTriggerActivationRow[],
): Promise<number[]> {
  const promises: Promise<number>[] = [];
  activations.forEach((activation) => {
    // retrieve the original provided body AND the created id
    promises.push(createSingleTriggerActivation(
      databaseConnection,
      activation,
    ));
  });

  const activationIds = await Promise.all(promises);

  return activationIds;
}

export { createSingleTriggerActivation, createMultipleTriggerActivations };
