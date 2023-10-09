import { Queryable, databaseQuery } from '../../main/database/databaseQuery';
import { DogRemindersRow, dogRemindersColumnsWithDRPrefix } from '../../main/types/DogRemindersRow';

/**
 *  If the query is successful, returns the reminder for the reminderId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getReminderForReminderId(databaseConnection: Queryable, reminderId: number, userConfigurationPreviousDogManagerSynchronization?: Date): Promise<DogRemindersRow | undefined> {
  const result = userConfigurationPreviousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumnsWithDRPrefix}
      FROM dogReminders dr
      WHERE TIMESTAMPDIFF(MICROSECOND, reminderLastModified, ?) <= 0 AND reminderId = ?
      LIMIT 1`,
      [userConfigurationPreviousDogManagerSynchronization, reminderId],
    )
    : await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumnsWithDRPrefix}
      FROM dogReminders dr
      WHERE reminderId = ?
      LIMIT 1`,
      [reminderId],
    );

  return result.safeIndex(0);
}

/**
 *  If the query is successful, returns an array of all the reminders for the dogId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllRemindersForDogId(databaseConnection: Queryable, dogId: number, userConfigurationPreviousDogManagerSynchronization?: Date): Promise<DogRemindersRow[]> {
  const result = userConfigurationPreviousDogManagerSynchronization !== undefined
    ? await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumnsWithDRPrefix}
      FROM dogReminders dr
      WHERE TIMESTAMPDIFF(MICROSECOND, reminderLastModified, ?) <= 0 AND dogId = ?
      LIMIT 18446744073709551615`,
      [userConfigurationPreviousDogManagerSynchronization, dogId],
    )
    : await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumnsWithDRPrefix}
      FROM dogReminders dr
      WHERE dogId = ?
      LIMIT 18446744073709551615`,
      [dogId],
    );

  return result;
}

export { getReminderForReminderId, getAllRemindersForDogId };
