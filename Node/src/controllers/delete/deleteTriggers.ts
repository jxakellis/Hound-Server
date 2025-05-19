import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

/**
 *  Queries the database to delete a single trigger. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteTriggerForTriggerUUID(databaseConnection: Queryable, triggerUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogTriggers
             SET triggerIsDeleted    = 1,
                 triggerLastModified = CURRENT_TIMESTAMP()
           WHERE triggerUUID = ?
             AND triggerIsDeleted = 0`,
    [triggerUUID],
  );
}

/**
 *  Queries the database to delete multiple triggers. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function deleteTriggersTriggerUUIDs(databaseConnection: Queryable, triggerUUIDs: string[]): Promise<void> {
  const promises = [];
  for (let i = 0; i < triggerUUIDs.length; i += 1) {
    promises.push(deleteTriggerForTriggerUUID(databaseConnection, triggerUUIDs[i]));
  }

  await Promise.all(promises);
}

/**
 *  Queries the database to delete all triggers for a dogUUID. If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteAllTriggersForDogUUID(databaseConnection: Queryable, dogUUID: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogTriggers
                     SET triggerIsDeleted    = 1,
                         triggerLastModified = CURRENT_TIMESTAMP()
                   WHERE dogUUID = ?
                     AND triggerIsDeleted = 0`,
    [dogUUID],
  );
}

export { deleteTriggersTriggerUUIDs, deleteAllTriggersForDogUUID };
