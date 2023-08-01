const { alarmLogger } = require('../../logging/loggers');

const { schedule } = require('./schedule');

const { areAllDefined } = require('../../validate/validateDefined');

/**
 * Cancels jobs scheduled with the provided familyId and reminderId
 */
async function cancelJobForFamilyForReminder(familyId, reminderId) {
  // cannot cancel job without familyId and reminderId
  if (areAllDefined(familyId, reminderId) === false) {
    return;
  }
  // attempt to locate job that has the userId and reminderId
  const job = schedule.scheduledJobs[`Family${familyId}Reminder${reminderId}`];
  if (areAllDefined(job)) {
    alarmLogger.debug(`Cancelling job: ${job.name}`);
    alarmLogger.debug(`Cancelled job; count is now ${Object.keys(schedule.scheduledJobs).length - 1}`);
    job.cancel();
  }
}

module.exports = { cancelJobForFamilyForReminder };
