const { databaseQuery } from '../../main/tools/database/databaseQuery';
const {
  formatNumber, formatDate, formatBoolean, formatArray, formatString,
} = require('../../main/tools/format/formatObject';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/tools/general/errors';

/**
 *  Queries the database to create a single reminder. If the query is successful, then returns the reminder with created reminderId added to it.
 *  If a problem is encountered, creates and throws custom error
 */
async function createReminderForDogIdReminder(databaseConnection, dogId, reminder) {
  if (areAllDefined(databaseConnection, dogId, reminder) === false) {
    throw new ValidationError('databaseConnection, dogId, or reminder missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // only retrieve enough not deleted reminders that would exceed the limit
  const reminders = await databaseQuery(
    databaseConnection,
    `SELECT 1
    FROM dogReminders dr
    WHERE reminderIsDeleted = 0 AND dogId = ?
    LIMIT ?`,
    [dogId, global.CONSTANT.LIMIT.NUMBER_OF_REMINDERS_PER_DOG],
  );

  // make sure that the user isn't creating too many reminders
  if (reminders.length >= global.CONSTANT.LIMIT.NUMBER_OF_REMINDERS_PER_DOG) {
    throw new ValidationError(`Dog reminder limit of ${global.CONSTANT.LIMIT.NUMBER_OF_REMINDERS_PER_DOG} exceeded`, global.CONSTANT.ERROR.FAMILY.LIMIT.REMINDER_TOO_LOW);
  }

  // general reminder components
  const { reminderAction, reminderType } = reminder; // required
  const reminderCustomActionName = formatString(reminder.reminderCustomActionName, 32); // required
  const reminderIsEnabled = formatBoolean(reminder.reminderIsEnabled); // required
  const reminderExecutionBasis = formatDate(reminder.reminderExecutionBasis); // required
  const reminderExecutionDate = formatDate(reminder.reminderExecutionDate); // optional

  // countdown components
  const countdownExecutionInterval = formatNumber(reminder.countdownExecutionInterval); // required

  // weekly components
  const weeklyUTCHour = formatNumber(reminder.weeklyUTCHour); // required
  const weeklyUTCMinute = formatNumber(reminder.weeklyUTCMinute); // required
  const weeklySunday = formatBoolean(reminder.weeklySunday); // required
  const weeklyMonday = formatBoolean(reminder.weeklyMonday); // required
  const weeklyTuesday = formatBoolean(reminder.weeklyTuesday); // required
  const weeklyWednesday = formatBoolean(reminder.weeklyWednesday); // required
  const weeklyThursday = formatBoolean(reminder.weeklyThursday); // required
  const weeklyFriday = formatBoolean(reminder.weeklyFriday); // required
  const weeklySaturday = formatBoolean(reminder.weeklySaturday); // required

  // monthly components
  const monthlyUTCHour = formatNumber(reminder.monthlyUTCHour); // required
  const monthlyUTCMinute = formatNumber(reminder.monthlyUTCMinute); // required
  const monthlyUTCDay = formatNumber(reminder.monthlyUTCDay); // required

  // one time components
  const oneTimeDate = formatDate(reminder.oneTimeDate); // required

  // check to see that necessary generic reminder components are present
  if (areAllDefined(reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis) === false) {
    throw new ValidationError('reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, or reminderExecutionBasis missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  else if (reminderType !== 'countdown' && reminderType !== 'weekly' && reminderType !== 'monthly' && reminderType !== 'oneTime') {
    throw new ValidationError('reminderType invalid', global.CONSTANT.ERROR.VALUE.INVALID);
  }
  // no need to check snooze components as a newly created reminder can't be snoozed yet
  else if (areAllDefined(countdownExecutionInterval) === false) {
    throw new ValidationError('countdownExecutionInterval missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // no need to check weeklySkippedDate validity as newly created reminder can't be skipped yet
  else if (areAllDefined(weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday) === false) {
    throw new ValidationError(`weeklyUTCHour
weeklyUTCMinute
weeklySunday
weeklyMonday
weeklyTuesday
weeklyWednesday
weeklyThursday
weeklyFriday
or weeklySaturday missing`, global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // no need to check monthlySkippedDate validity as newly created reminder can't be skipped yet
  else if (areAllDefined(monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute) === false) {
    throw new ValidationError('monthlyUTCDay, monthlyUTCHour, or monthlyUTCMinute missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  else if (areAllDefined(oneTimeDate) === false) {
    throw new ValidationError('oneTimeDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const result = await databaseQuery(
    databaseConnection,
    `INSERT INTO dogReminders(
      dogId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate,
      reminderLastModified,
      snoozeExecutionInterval, countdownExecutionInterval, 
      weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday, weeklySkippedDate,
      monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, monthlySkippedDate, oneTimeDate)
    VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP(),
      ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?)`,
    [
      dogId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate,
      null,
      countdownExecutionInterval,
      weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday, null,
      monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, null,
      oneTimeDate,
    ],
  );

  // ...reminder must come first otherwise its placeholder reminderId will override the real one
  // was able to successfully create reminder, return the provided reminder with its added to the body
  return {
    ...reminder,
    reminderId: result.insertId,
  };
}

/**
   * Queries the database to create a multiple reminders. If the query is successful, then returns the reminders with their created reminderIds added to them.
 *  If a problem is encountered, creates and throws custom error
   */
async function createRemindersForDogIdReminders(databaseConnection, dogId, forReminders) {
  const reminders = formatArray(forReminders); // required
  if (areAllDefined(databaseConnection, dogId, reminders) === false) {
    throw new ValidationError('databaseConnection, dogId, or reminders missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  let reminderPromises = [];
  for (let i = 0; i < reminders.length; i += 1) {
    // retrieve the original provided body AND the created id
    reminderPromises.push(createReminderForDogIdReminder(databaseConnection, dogId, reminders[i]));
  }
  reminderPromises = await Promise.all(reminderPromises);

  return reminderPromises;
}

export { createReminderForDogIdReminder, createRemindersForDogIdReminders };
