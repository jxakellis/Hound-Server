import { alarmLogger } from '../../../logging/loggers';

import { schedule } from './schedule';

/**
 * Cancels jobs scheduled with the provided familyId and reminderId
 */
async function cancelJobForFamilyForReminder(familyId: string, reminderId: number): Promise<void> {
  // attempt to locate job that has the userId and reminderId
  const jobKey = `Family${familyId}Reminder${reminderId}`;
  const job = schedule.scheduledJobs[jobKey];

  if (job === undefined || job === null) {
    return;
  }

  alarmLogger.debug(`Cancelling job: ${job.name}`);
  job.cancel();
  alarmLogger.debug(`Cancelled job; count is now ${Object.keys(schedule.scheduledJobs).length}`);
}

export { cancelJobForFamilyForReminder };
