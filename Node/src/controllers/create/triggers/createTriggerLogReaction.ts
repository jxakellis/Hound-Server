import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import type { NotYetCreatedDogTriggerLogReactionRow } from '../../../main/types/rows/DogTriggerLogReactionRow.js';

/**
*  Queries the database to create a single trigger. If the query is successful, then returns the trigger with created triggerId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createSingleTriggerLogReaction(
  databaseConnection: Queryable,
  reaction: NotYetCreatedDogTriggerLogReactionRow,
): Promise<number> {
  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogTriggerLogReaction(triggerUUID, logActionTypeId, logCustomActionName) VALUES (?, ?, ?)',
    [
      reaction.triggerUUID,
      reaction.logActionTypeId,
      reaction.logCustomActionName,
    ],
  );

  return result.insertId;
}

/**
          * Queries the database to create a multiple triggers. If the query is successful, then returns the triggers with their created triggerIds added to them.
          *  If a problem is encountered, creates and throws custom error
          */
async function createMultipleTriggerLogReactions(
  databaseConnection: Queryable,
  reactions: NotYetCreatedDogTriggerLogReactionRow[],
): Promise<number[]> {
  const promises: Promise<number>[] = [];
  reactions.forEach((reaction) => {
    // retrieve the original provided body AND the created id
    promises.push(createSingleTriggerLogReaction(
      databaseConnection,
      reaction,
    ));
  });

  const reactionIds = await Promise.all(promises);

  return reactionIds;
}

export { createSingleTriggerLogReaction, createMultipleTriggerLogReactions };
