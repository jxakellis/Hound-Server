import { type DogRemindersRow, type NotYetCreatedDogRemindersRow } from '../../../main/types/rows/DogRemindersRow.js';

import { type Queryable, type ResultSetHeader, databaseQuery } from '../../../main/database/databaseQuery.js';
import { LIMIT } from '../../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../../main/server/globalErrors.js';
import { getAllRemindersForDogUUID } from '../../get/reminders/getReminders.js';
import { createReminderRecipients } from './createReminderRecipient.js';
import { formatKnownString } from '../../../main/format/formatObject.js';
import { getReminderActionTypeForId } from '../../get/types/getReminderActionType.js';

/**
*  Queries the database to create a single reminder. If the query is successful, then returns the reminder with created reminderId added to it.
*  If a problem is encountered, creates and throws custom error
*/
async function createReminderForReminder(
  databaseConnection: Queryable,
  reminder: NotYetCreatedDogRemindersRow,
): Promise<number> {
  const notDeletedReminders = await getAllRemindersForDogUUID(databaseConnection, reminder.dogUUID, false, undefined);

  // make sure that the user isn't creating too many reminders
  if (notDeletedReminders.length >= LIMIT.NUMBER_OF_REMINDERS_PER_DOG) {
    throw new HoundError(`Dog reminder limit of ${LIMIT.NUMBER_OF_REMINDERS_PER_DOG} exceeded`, createReminderForReminder, ERROR_CODES.FAMILY.LIMIT.REMINDER_TOO_LOW);
  }

  // TODO FUTURE DEPRECIATE this reminderAction is compatibility for <= 3.5.0
  const reminderAction = await getReminderActionTypeForId(databaseConnection, reminder.reminderActionTypeId);

  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO dogReminders(
          dogUUID,
          reminderUUID,
          DEPRECIATED_reminderAction,
          reminderActionTypeId, reminderCustomActionName, reminderType, reminderIsTriggerResult, reminderIsEnabled,
          reminderExecutionBasis, reminderExecutionDate,
          reminderLastModified, reminderIsDeleted,
          snoozeExecutionInterval,
          countdownExecutionInterval,
          weeklyUTCHour, weeklyUTCMinute,
          weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday,
          weeklySkippedDate,
          monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute,
          monthlySkippedDate,
          oneTimeDate
          )
          VALUES (
            ?,
            ?,
            ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            CURRENT_TIMESTAMP(), 0,
            ?,
            ?,
            ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?,
            ?, ?, ?,
            ?,
            ?
            )`,
    [
      reminder.dogUUID,
      reminder.reminderUUID,
      reminderAction?.internalValue,
      reminder.reminderActionTypeId, formatKnownString(reminder.reminderCustomActionName, 32), reminder.reminderType, reminder.reminderIsTriggerResult, reminder.reminderIsEnabled,
      reminder.reminderExecutionBasis, reminder.reminderExecutionDate,
      // none, default values
      reminder.snoozeExecutionInterval,
      reminder.countdownExecutionInterval,
      reminder.weeklyUTCHour, reminder.weeklyUTCMinute,
      reminder.weeklySunday, reminder.weeklyMonday, reminder.weeklyTuesday, reminder.weeklyWednesday, reminder.weeklyThursday, reminder.weeklyFriday, reminder.weeklySaturday,
      reminder.weeklySkippedDate,
      reminder.monthlyUTCDay, reminder.monthlyUTCHour, reminder.monthlyUTCMinute,
      reminder.monthlySkippedDate,
      reminder.oneTimeDate,
    ],
  );

  await createReminderRecipients(
    databaseConnection,
    reminder.reminderRecipientUserIds.map((userId) => ({ reminderUUID: reminder.reminderUUID, userId })),
  );

  return result.insertId;
}

/**
          * Queries the database to create a multiple reminders. If the query is successful, then returns the reminders with their created reminderIds added to them.
          *  If a problem is encountered, creates and throws custom error
          */
async function createRemindersForReminders(
  databaseConnection: Queryable,
  reminders: NotYetCreatedDogRemindersRow[],
): Promise<DogRemindersRow[]> {
  const promises: Promise<number>[] = [];
  reminders.forEach((reminder) => {
    // retrieve the original provided body AND the created id
    promises.push(createReminderForReminder(
      databaseConnection,
      reminder,
    ));
  });

  const reminderIds = await Promise.all(promises);

  const someReminder = reminders.safeIndex(0);

  if (someReminder === undefined || someReminder === null) {
    // Only way this happens is if reminders is an empty array
    return [];
  }

  const notDeletedReminders = await getAllRemindersForDogUUID(databaseConnection, someReminder.dogUUID, false);
  // Once we have created all of the reminders, we need to return them to the user. Its hard to link the omit and non-omit types, so just use the dogUUID to query the reminders, and only include the ones we just created
  const notDeletedReturnReminders = notDeletedReminders.filter((reminderFromDatabase) => reminderIds.includes(reminderFromDatabase.reminderId));

  return notDeletedReturnReminders;
}

export { createRemindersForReminders };
