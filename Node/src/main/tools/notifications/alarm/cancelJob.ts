import { alarmLogger } from '../../../logging/loggers.js';

import { schedule } from './schedule.js';

/**
 * Cancels jobs scheduled with the provided familyId and reminderUUID
 */
async function cancelJobForFamilyForReminder(familyId: string, reminderUUID: string): Promise<void> {
  // attempt to locate job that has the userId and reminderUUID
  const jobKey = `Family${familyId}Reminder${reminderUUID}`;
  const job = schedule.scheduledJobs[jobKey];

  if (job === undefined || job === null) {
    return;
  }

  alarmLogger.debug(`Cancelling job: ${job}`);
  job.cancel();
  alarmLogger.debug(`Cancelled job; count is now ${Object.keys(schedule.scheduledJobs).length}`);
}

export { cancelJobForFamilyForReminder };
