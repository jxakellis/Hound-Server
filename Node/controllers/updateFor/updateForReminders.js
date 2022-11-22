const { ValidationError } = require('../../main/tools/general/errors');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatNumber, formatDate, formatBoolean, formatArray, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

/**
 *  Queries the database to create a update reminder. If the query is successful, then returns the provided reminder
 *  If a problem is encountered, creates and throws custom error
 */
async function updateReminderForDogIdReminder(databaseConnection, dogId, reminder) {
  // check that we have a reminder to update in the first place
  if (areAllDefined(databaseConnection, dogId, reminder) === false) {
    throw new ValidationError('databaseConnection, dogId, or reminder missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // general reminder components
  const {
    reminderId, reminderAction, reminderType,
  } = reminder;
  const reminderCustomActionName = formatString(reminder.reminderCustomActionName, 32);
  const reminderIsEnabled = formatBoolean(reminder.reminderIsEnabled);
  const reminderExecutionBasis = formatDate(reminder.reminderExecutionBasis);
  const reminderExecutionDate = formatDate(reminder.reminderExecutionDate);
  const reminderLastModified = new Date();

  // snooze components
  const snoozeExecutionInterval = formatNumber(reminder.snoozeExecutionInterval);

  // countdown components
  const countdownExecutionInterval = formatNumber(reminder.countdownExecutionInterval);

  // weekly components
  const weeklyUTCHour = formatNumber(reminder.weeklyUTCHour);
  const weeklyUTCMinute = formatNumber(reminder.weeklyUTCMinute);
  const weeklySunday = formatBoolean(reminder.weeklySunday);
  const weeklyMonday = formatBoolean(reminder.weeklyMonday);
  const weeklyTuesday = formatBoolean(reminder.weeklyTuesday);
  const weeklyWednesday = formatBoolean(reminder.weeklyWednesday);
  const weeklyThursday = formatBoolean(reminder.weeklyThursday);
  const weeklyFriday = formatBoolean(reminder.weeklyFriday);
  const weeklySaturday = formatBoolean(reminder.weeklySaturday);
  const weeklySkippedDate = formatDate(reminder.weeklySkippedDate);

  // monthly components
  const monthlyUTCDay = formatNumber(reminder.monthlyUTCDay);
  const monthlyUTCHour = formatNumber(reminder.monthlyUTCHour);
  const monthlyUTCMinute = formatNumber(reminder.monthlyUTCMinute);
  const monthlySkippedDate = formatDate(reminder.monthlySkippedDate);

  // one time components
  const oneTimeDate = formatDate(reminder.oneTimeDate);

  // check to see that necessary generic reminder components are present
  if (areAllDefined(reminderId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis) === false) {
    throw new ValidationError('reminderId, reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, or reminderExecutionBasis missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  else if (reminderType !== 'countdown' && reminderType !== 'weekly' && reminderType !== 'monthly' && reminderType !== 'oneTime') {
    throw new ValidationError('reminderType invalid', global.CONSTANT.ERROR.VALUE.INVALID);
  }
  // snoozeExecutionInterval optional
  // countdown
  else if (areAllDefined(countdownExecutionInterval) === false) {
    throw new ValidationError('countdownExecutionInterval missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // weekly
  else if (areAllDefined(weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday) === false) {
    throw new ValidationError('weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, or weeklySaturday missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // monthly
  else if (areAllDefined(monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute) === false) {
    throw new ValidationError('monthlyUTCDay, monthlyUTCHour, or monthlyUTCMinute missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // oneTime
  else if (areAllDefined(oneTimeDate) === false) {
    throw new ValidationError('oneTimeDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    'UPDATE dogReminders SET reminderAction = ?, reminderCustomActionName = ?, reminderType = ?, reminderIsEnabled = ?, reminderExecutionBasis = ?, reminderExecutionDate = ?, reminderLastModified = ?, snoozeExecutionInterval = ?, countdownExecutionInterval = ?, weeklyUTCHour = ?, weeklyUTCMinute = ?, weeklySunday = ?, weeklyMonday = ?, weeklyTuesday = ?, weeklyWednesday = ?, weeklyThursday = ?, weeklyFriday = ?, weeklySaturday = ?, weeklySkippedDate = ?, monthlyUTCDay = ?, monthlyUTCHour = ?, monthlyUTCMinute = ?, monthlySkippedDate = ?, oneTimeDate = ? WHERE reminderId = ?',
    [
      reminderAction, reminderCustomActionName, reminderType, reminderIsEnabled, reminderExecutionBasis, reminderExecutionDate, reminderLastModified,
      snoozeExecutionInterval,
      countdownExecutionInterval,
      weeklyUTCHour, weeklyUTCMinute, weeklySunday, weeklyMonday, weeklyTuesday, weeklyWednesday, weeklyThursday, weeklyFriday, weeklySaturday, weeklySkippedDate,
      monthlyUTCDay, monthlyUTCHour, monthlyUTCMinute, monthlySkippedDate,
      oneTimeDate,
      reminderId,
    ],
  );

  return reminder;
}

/**
 *  Queries the database to update multiple reminders. If the query is successful, then return the provided reminders
 *  If a problem is encountered, creates and throws custom error
 */
async function updateRemindersForDogIdReminders(databaseConnection, dogId, forReminders) {
  const reminders = formatArray(forReminders);

  if (areAllDefined(databaseConnection, dogId, reminders) === false) {
    throw new ValidationError('databaseConnection, dogId, or reminders missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [];
  for (let i = 0; i < reminders.length; i += 1) {
    promises.push(updateReminderForDogIdReminder(databaseConnection, dogId, reminders[i]));
  }
  await Promise.all(promises);

  return reminders;
}

module.exports = { updateReminderForDogIdReminder, updateRemindersForDogIdReminders };
