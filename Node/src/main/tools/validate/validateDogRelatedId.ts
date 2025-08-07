import express from 'express';
import {
  formatArray, formatUnknownString,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';

import { type DogsRow } from '../../types/rows/DogsRow.js';
import { type DogLogsRow } from '../../types/rows/DogLogsRow.js';
import { type DogRemindersRow } from '../../types/rows/DogRemindersRow.js';
import { type StringKeyDict } from '../../types/StringKeyDict.js';
import { getDogForDogUUID } from '../../../controllers/get/getDogs.js';
import { getLogForLogUUID } from '../../../controllers/get/logs/getLogs.js';
import { getReminderForReminderUUID } from '../../../controllers/get/reminders/getReminders.js';
import { type DogTriggersRow } from '../../types/rows/DogTriggersRow.js';
import { getTriggerForTriggerUUID } from '../../../controllers/get/triggers/getTriggers.js';

async function validateDogUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authFamilyId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateDogUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateDogUUID, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedDogsDict = formatArray(req.body['dogs']
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? req.body['dogReminders']
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? req.body['dogLogs']
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? req.body['dogTriggers']
      ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedDogsDict === undefined || masterUnvalidatedDogsDict === null) {
      // We have no dogUUIDs to validate
      return next();
    }

    // 1:1 arrays of unauthDogsDict and getDogForDogUUID promise.
    const dogPromises: Promise<DogsRow | undefined>[] = [];
    const unvalidatedDogDictsForPromises: StringKeyDict[] = [];

    // query for all dogs provided
    masterUnvalidatedDogsDict.forEach((unauthNewDogDict) => {
      const dogUUID = formatUnknownString(unauthNewDogDict['dogUUID']);

      if (dogUUID === undefined || dogUUID === null) {
        // If dogUUID is missing, the dog body wasn't provided
        req.houndProperties.unauthenticated.unauthDogsDict.push(unauthNewDogDict);
        return;
      }

      // Add these objects to verify to an array. We resolve the promise and use unauthNewDogDict if the promise resolved to nothing.
      dogPromises.push(getDogForDogUUID(databaseConnection, dogUUID, true, false, undefined));
      unvalidatedDogDictsForPromises.push(unauthNewDogDict);
    });

    const queriedDogs = await Promise.all(dogPromises);

    queriedDogs.forEach((queriedDog, index) => {
      const unvalidatedDogDictForQueriedDog = unvalidatedDogDictsForPromises[index];

      if (queriedDog === undefined || queriedDog === null) {
        // If queriedDog doesn't exist, then a dog corresponding to that dogUUID doesn't exist yet.
        req.houndProperties.unauthenticated.unauthDogsDict.push(unvalidatedDogDictForQueriedDog);
        return;
      }

      if (authFamilyId !== queriedDog.familyId) {
        throw new HoundError(
          'Dog has invalid permissions',
          validateDogUUID,
          ERROR_CODES.PERMISSION.NO.DOG,
        );
      }

      if (queriedDog.dogIsDeleted === 1) {
        throw new HoundError('Dog has been deleted', validateDogUUID, ERROR_CODES.FAMILY.DELETED.DOG);
      }

      // dogUUID has been validated. Save it to authenticated
      req.houndProperties.authenticated.authDogs.push(
        {
          authDog: queriedDog,
          unauthNewDogDict: unvalidatedDogDictForQueriedDog,
        },
      );
    });
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateLogUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authDogs } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateLogUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (authDogs === undefined || authDogs === null) {
      throw new HoundError('authDogs missing', validateLogUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedLogsDict = formatArray(req.body['dogLogs'] ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedLogsDict === undefined || masterUnvalidatedLogsDict === null) {
      return next();
    }

    // 1:1 arrays of unauthLogsDict and getLogForLogUUID promise.
    const logPromises: Promise<DogLogsRow | undefined>[] = [];
    const unvalidatedLogDictsForPromises: StringKeyDict[] = [];

    // query for all logs provided
    masterUnvalidatedLogsDict.forEach((unauthNewLogDict) => {
      const logUUID = formatUnknownString(unauthNewLogDict['logUUID']);

      if (logUUID === undefined || logUUID == null) {
        // If logUUID is missing, the log body wasn't provided
        req.houndProperties.unauthenticated.unauthLogsDict.push(unauthNewLogDict);
        return;
      }

      logPromises.push(getLogForLogUUID(databaseConnection, logUUID, true));
      unvalidatedLogDictsForPromises.push(unauthNewLogDict);
    });

    const queriedLogs = await Promise.all(logPromises);

    queriedLogs.forEach((queriedLog, index) => {
      const unvalidatedLogDictForQueriedLog = unvalidatedLogDictsForPromises[index];

      if (queriedLog === undefined || queriedLog === null) {
        // If queriedLog doesn't exist, then a log corresponding to that logUUID doesn't exist yet.
        req.houndProperties.unauthenticated.unauthLogsDict.push(unvalidatedLogDictForQueriedLog);
        return;
      }

      if (authDogs.findIndex((authDog) => authDog.authDog.dogUUID === queriedLog.dogUUID) === -1) {
        throw new HoundError('Log has invalid permissions', validateLogUUID, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (queriedLog.logIsDeleted === 1) {
        throw new HoundError('Log has been deleted', validateLogUUID, ERROR_CODES.FAMILY.DELETED.LOG);
      }

      // logUUID has been validated. Save it to authenticated
      req.houndProperties.authenticated.authLogs.push(
        {
          authLog: queriedLog,
          unauthNewLogDict: unvalidatedLogDictForQueriedLog,
        },
      );
    });
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateReminderUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authDogs } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateReminderUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (authDogs === undefined || authDogs === null) {
      throw new HoundError('authDogs missing', validateReminderUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedRemindersDict = formatArray(req.body['dogReminders'] ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedRemindersDict === undefined || masterUnvalidatedRemindersDict === null) {
      return next();
    }

    // 1:1 arrays of unauthRemindersDict and getReminderForReminderUUID promise.
    const reminderPromises: Promise<DogRemindersRow | undefined>[] = [];
    const unvalidatedReminderDictsForPromises: StringKeyDict[] = [];

    // query for all reminders provided
    masterUnvalidatedRemindersDict.forEach((unauthNewReminderDict) => {
      const reminderUUID = formatUnknownString(unauthNewReminderDict['reminderUUID']);

      if (reminderUUID === undefined || reminderUUID === null) {
        // If reminderUUID is missing, the reminder body wasn't provided
        req.houndProperties.unauthenticated.unauthRemindersDict.push(unauthNewReminderDict);
        return;
      }

      reminderPromises.push(getReminderForReminderUUID(databaseConnection, reminderUUID, true));
      unvalidatedReminderDictsForPromises.push(unauthNewReminderDict);
    });

    const queriedReminders = await Promise.all(reminderPromises);

    queriedReminders.forEach((queriedReminder, index) => {
      const unvalidatedReminderDictForQueriedReminder = unvalidatedReminderDictsForPromises[index];

      if (queriedReminder === undefined || queriedReminder === null) {
        // If queriedReminder doesn't exist, then a reminder corresponding to that reminderUUID doesn't exist yet.
        req.houndProperties.unauthenticated.unauthRemindersDict.push(unvalidatedReminderDictForQueriedReminder);
        return;
      }

      if (authDogs.findIndex((authDog) => authDog.authDog.dogUUID === queriedReminder.dogUUID) <= -1) {
        throw new HoundError(
          'Reminder has invalid permissions',
          validateReminderUUID,
          ERROR_CODES.PERMISSION.NO.REMINDER,
          undefined,
          `
          index ${index};
          authDogs.length ${authDogs.length}; masterUnvalidatedRemindersDict.length ${masterUnvalidatedRemindersDict.length};
          reminderPromises.length ${reminderPromises.length}; unvalidatedReminderDictsForPromises.length ${unvalidatedReminderDictsForPromises};
          unvalidatedReminderDictForQueriedReminder.reminderUUID ${unvalidatedReminderDictForQueriedReminder['reminderUUID']};
          queriedReminder.reminderId ${queriedReminder.reminderId}; queriedReminder.reminderUUID ${queriedReminder.reminderUUID}; queriedReminder.dogUUID ${queriedReminder.dogUUID}
          `,
        );
      }

      if (queriedReminder.reminderIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Reminder has been deleted', validateReminderUUID, ERROR_CODES.FAMILY.DELETED.REMINDER);
      }

      // reminderUUID has been validated. Save it to authenticated
      req.houndProperties.authenticated.authReminders.push(
        {
          authReminder: queriedReminder,
          unauthNewReminderDict: unvalidatedReminderDictForQueriedReminder,
        },
      );
    });
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateTriggerUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authDogs } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateTriggerUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (authDogs === undefined || authDogs === null) {
      throw new HoundError('authDogs missing', validateTriggerUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedTriggersDict = formatArray(req.body['dogTriggers'] ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedTriggersDict === undefined || masterUnvalidatedTriggersDict === null) {
      return next();
    }

    // 1:1 arrays of unauthTriggersDict and getTriggerForTriggerUUID promise.
    const triggerPromises: Promise<DogTriggersRow | undefined>[] = [];
    const unvalidatedTriggerDictsForPromises: StringKeyDict[] = [];

    // query for all triggers provided
    masterUnvalidatedTriggersDict.forEach((unauthNewTriggerDict) => {
      const triggerUUID = formatUnknownString(unauthNewTriggerDict['triggerUUID']);

      if (triggerUUID === undefined || triggerUUID === null) {
        // If triggerUUID is missing, the trigger body wasn't provided
        req.houndProperties.unauthenticated.unauthTriggersDict.push(unauthNewTriggerDict);
        return;
      }

      triggerPromises.push(getTriggerForTriggerUUID(databaseConnection, triggerUUID, true));
      unvalidatedTriggerDictsForPromises.push(unauthNewTriggerDict);
    });

    const queriedTriggers = await Promise.all(triggerPromises);

    queriedTriggers.forEach((queriedTrigger, index) => {
      const unvalidatedTriggerDictForQueriedTrigger = unvalidatedTriggerDictsForPromises[index];

      if (queriedTrigger === undefined || queriedTrigger === null) {
        // If queriedTrigger doesn't exist, then a trigger corresponding to that triggerUUID doesn't exist yet.
        req.houndProperties.unauthenticated.unauthTriggersDict.push(unvalidatedTriggerDictForQueriedTrigger);
        return;
      }

      if (authDogs.findIndex((authDog) => authDog.authDog.dogUUID === queriedTrigger.dogUUID) <= -1) {
        throw new HoundError(
          'Trigger has invalid permissions',
          validateTriggerUUID,
          ERROR_CODES.PERMISSION.NO.TRIGGER,
          undefined,
          `
          index ${index};
          authDogs.length ${authDogs.length}; masterUnvalidatedTriggersDict.length ${masterUnvalidatedTriggersDict.length};
          triggerPromises.length ${triggerPromises.length}; unvalidatedTriggerDictsForPromises.length ${unvalidatedTriggerDictsForPromises};
          unvalidatedTriggerDictForQueriedTrigger.triggerUUID ${unvalidatedTriggerDictForQueriedTrigger['triggerUUID']};
          queriedTrigger.triggerId ${queriedTrigger.triggerId}; queriedTrigger.triggerUUID ${queriedTrigger.triggerUUID}; queriedTrigger.dogUUID ${queriedTrigger.dogUUID}
          `,
        );
      }

      if (queriedTrigger.triggerIsDeleted === 1) {
        // the trigger has been found but its been deleted
        throw new HoundError('Trigger has been deleted', validateTriggerUUID, ERROR_CODES.FAMILY.DELETED.TRIGGER);
      }

      // triggerUUID has been validated. Save it to authenticated
      req.houndProperties.authenticated.authTriggers.push(
        {
          authTrigger: queriedTrigger,
          unauthNewTriggerDict: unvalidatedTriggerDictForQueriedTrigger,
        },
      );
    });
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }

  return next();
}

export {
  validateDogUUID, validateLogUUID, validateReminderUUID, validateTriggerUUID,
};
