import { getTriggerReminderResultForTriggerUUIDs } from '../../../controllers/get/triggers/getTriggerReminderResult.js';
import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import type { DogTriggerReminderResultRow, NotYetCreatedDogTriggerReminderResultRow } from '../../../main/types/rows/DogTriggerReminderResultRow.js';

/**
*  Queries the database to create a single trigger. If the query is successful, then returns the trigger with created triggerId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createTriggerReminderResult(
  databaseConnection: Queryable,
  reaction: NotYetCreatedDogTriggerReminderResultRow,
): Promise<number> {
  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    'INSERT INTO dogTriggerReminderResult(triggerUUID, reminderActionTypeId, reminderCustomActionName) VALUES (?, ?, ?)',
    [
      reaction.triggerUUID,
      reaction.reminderActionTypeId,
      reaction.reminderCustomActionName,
    ],
  );

  return result.insertId;
}

/**
          * Queries the database to create a multiple triggers. If the query is successful, then returns the triggers with their created triggerIds added to them.
          *  If a problem is encountered, creates and throws custom error
          */
async function createTriggerReminderResults(
  databaseConnection: Queryable,
  reactions: NotYetCreatedDogTriggerReminderResultRow[],
): Promise<DogTriggerReminderResultRow []> {
  const promises: Promise<number>[] = [];
  reactions.forEach((reaction) => {
    // retrieve the original provided body AND the created id
    promises.push(createTriggerReminderResult(
      databaseConnection,
      reaction,
    ));
  });

  const reactionIds = await Promise.all(promises);

  const someReaction = reactions.safeIndex(0);

  if (someReaction === undefined || someReaction === null) {
    // Only way this happens is if reactions is an empty array
    return [];
  }

  const uniqueReactionUUIDs = [...new Set(reactions.map((reaction) => reaction.triggerUUID))];

  const notDeletedReactions = await getTriggerReminderResultForTriggerUUIDs(databaseConnection, uniqueReactionUUIDs);

  // Once we have created all of the reactions, we need to return them to the user. Its hard to link the omit and non-omit types, so just use the triggerUUID to query the triggers, and only include the ones we just created
  const notDeletedReturnReactions = notDeletedReactions.filter((reactionFromDatabase) => reactionIds.includes(reactionFromDatabase.reactionId));

  return notDeletedReturnReactions;
}

export { createTriggerReminderResult, createTriggerReminderResults };
