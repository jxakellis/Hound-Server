import { type Queryable, databaseQuery } from '../../../main/database/databaseQuery.js';
import { dogTriggerActivationColumns, type DogTriggerActivationRow } from '../../../main/types/rows/DogTriggerActivationRow.js';

async function getTriggerActivationsForTriggerUUID(
  databaseConnection: Queryable,
  triggerUUID: string,
): Promise<DogTriggerActivationRow[]> {
  return databaseQuery<DogTriggerActivationRow[]>(
    databaseConnection,
    `SELECT ${dogTriggerActivationColumns}
           FROM dogTriggerActivation dta
          WHERE dta.triggerUUID = ?
          LIMIT 18446744073709551615`,
    [triggerUUID],
  );
}

async function getTriggerActivationsForTriggerUUIDs(
  databaseConnection: Queryable,
  triggerUUIDs: string[],
): Promise<(DogTriggerActivationRow)[]> {
  return databaseQuery<(
DogTriggerActivationRow)[]>(
    databaseConnection,
    `SELECT ${dogTriggerActivationColumns}
             FROM dogTriggerActivation dta
            WHERE dta.triggerUUID IN (?)
            LIMIT 18446744073709551615`,
    [triggerUUIDs],
    );
}

export { getTriggerActivationsForTriggerUUID, getTriggerActivationsForTriggerUUIDs };
