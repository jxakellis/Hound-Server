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
import { getLogForLogUUID } from '../../../controllers/get/getLogs.js';
import { getReminderForReminderUUID } from '../../../controllers/get/getReminders.js';
import { type DogTriggersRow } from '../../types/rows/DogTriggersRow.js';
import { getTriggerForTriggerUUID } from '../../../controllers/get/triggers/getTriggers.js';

async function validateDogUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateDogUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateDogUUID, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // TODO DEPRECIATE <= 3.5.0 switched to dogReminders/dogLogs
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedDogsDict = formatArray(req.body['dogs']
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? req.body['dogReminders'] ?? req.body['reminders']
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? req.body['dogLogs'] ?? req.body['logs']
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? req.body['dogTriggers']
      ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedDogsDict === undefined || masterUnvalidatedDogsDict === null) {
      // We have no dogUUIDs to validate
      return next();
    }

    // 1:1 arrays of unvalidatedDogsDict and getDogForDogUUID promise.
    const dogPromises: Promise<DogsRow | undefined>[] = [];
    const unvalidatedDogDictsForPromises: StringKeyDict[] = [];

    // query for all dogs provided
    masterUnvalidatedDogsDict.forEach((unvalidatedDogDict) => {
      const dogUUID = formatUnknownString(unvalidatedDogDict['dogUUID']);

      if (dogUUID === undefined || dogUUID === null) {
        // If dogUUID is missing, the dog body wasn't provided
        req.houndProperties.unvalidatedVars.unvalidatedDogsDict.push(unvalidatedDogDict);
        return;
      }

      // Add these objects to verify to an array. We resolve the promise and use unvalidatedDogDict if the promise resolved to nothing.
      dogPromises.push(getDogForDogUUID(databaseConnection, dogUUID, true, false, undefined));
      unvalidatedDogDictsForPromises.push(unvalidatedDogDict);
    });

    const queriedDogs = await Promise.all(dogPromises);

    queriedDogs.forEach((queriedDog, index) => {
      const unvalidatedDogDictForQueriedDog = unvalidatedDogDictsForPromises[index];

      if (queriedDog === undefined || queriedDog === null) {
        // If queriedDog doesn't exist, then a dog corresponding to that dogUUID doesn't exist yet.
        req.houndProperties.unvalidatedVars.unvalidatedDogsDict.push(unvalidatedDogDictForQueriedDog);
        return;
      }

      if (validatedFamilyId !== queriedDog.familyId) {
        throw new HoundError(
          'Dog has invalid permissions',
          validateDogUUID,
          ERROR_CODES.PERMISSION.NO.DOG,
        );
      }

      if (queriedDog.dogIsDeleted === 1) {
        throw new HoundError('Dog has been deleted', validateDogUUID, ERROR_CODES.FAMILY.DELETED.DOG);
      }

      // dogUUID has been validated. Save it to validatedVars
      req.houndProperties.validatedVars.validatedDogs.push(
        {
          validatedDogId: queriedDog.dogId,
          validatedDogUUID: queriedDog.dogUUID,
          unvalidatedDogDict: unvalidatedDogDictForQueriedDog,
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
    const { validatedDogs } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateLogUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateLogUUID, ERROR_CODES.VALUE.MISSING);
    }

    // TODO DEPRECIATE <= 3.5.0 switched to dogReminders/dogLogs
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedLogsDict = formatArray(req.body['dogLogs'] ?? req.body['logs'] ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedLogsDict === undefined || masterUnvalidatedLogsDict === null) {
      return next();
    }

    // 1:1 arrays of unvalidatedLogsDict and getLogForLogUUID promise.
    const logPromises: Promise<DogLogsRow | undefined>[] = [];
    const unvalidatedLogDictsForPromises: StringKeyDict[] = [];

    // query for all logs provided
    masterUnvalidatedLogsDict.forEach((unvalidatedLogDict) => {
      const logUUID = formatUnknownString(unvalidatedLogDict['logUUID']);

      if (logUUID === undefined || logUUID == null) {
        // If logUUID is missing, the log body wasn't provided
        req.houndProperties.unvalidatedVars.unvalidatedLogsDict.push(unvalidatedLogDict);
        return;
      }

      logPromises.push(getLogForLogUUID(databaseConnection, logUUID, true));
      unvalidatedLogDictsForPromises.push(unvalidatedLogDict);
    });

    const queriedLogs = await Promise.all(logPromises);

    queriedLogs.forEach((queriedLog, index) => {
      const unvalidatedLogDictForQueriedLog = unvalidatedLogDictsForPromises[index];

      if (queriedLog === undefined || queriedLog === null) {
        // If queriedLog doesn't exist, then a log corresponding to that logUUID doesn't exist yet.
        req.houndProperties.unvalidatedVars.unvalidatedLogsDict.push(unvalidatedLogDictForQueriedLog);
        return;
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogUUID === queriedLog.dogUUID) === -1) {
        throw new HoundError('Log has invalid permissions', validateLogUUID, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (queriedLog.logIsDeleted === 1) {
        throw new HoundError('Log has been deleted', validateLogUUID, ERROR_CODES.FAMILY.DELETED.LOG);
      }

      // logUUID has been validated. Save it to validatedVars
      req.houndProperties.validatedVars.validatedLogs.push(
        {
          validatedDogUUID: queriedLog.dogUUID,
          validatedLogId: queriedLog.logId,
          validatedLogUUID: queriedLog.logUUID,
          unvalidatedLogDict: unvalidatedLogDictForQueriedLog,
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
    const { validatedDogs } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateReminderUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateReminderUUID, ERROR_CODES.VALUE.MISSING);
    }

    // TODO DEPRECIATE <= 3.5.0 switched to dogReminders/dogLogs
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedRemindersDict = formatArray(req.body['dogReminders'] ?? req.body['reminders'] ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedRemindersDict === undefined || masterUnvalidatedRemindersDict === null) {
      return next();
    }

    // 1:1 arrays of unvalidatedRemindersDict and getReminderForReminderUUID promise.
    const reminderPromises: Promise<DogRemindersRow | undefined>[] = [];
    const unvalidatedReminderDictsForPromises: StringKeyDict[] = [];

    // query for all reminders provided
    masterUnvalidatedRemindersDict.forEach((unvalidatedReminderDict) => {
      const reminderUUID = formatUnknownString(unvalidatedReminderDict['reminderUUID']);

      if (reminderUUID === undefined || reminderUUID === null) {
        // If reminderUUID is missing, the reminder body wasn't provided
        req.houndProperties.unvalidatedVars.unvalidatedRemindersDict.push(unvalidatedReminderDict);
        return;
      }

      reminderPromises.push(getReminderForReminderUUID(databaseConnection, reminderUUID, true));
      unvalidatedReminderDictsForPromises.push(unvalidatedReminderDict);
    });

    const queriedReminders = await Promise.all(reminderPromises);

    queriedReminders.forEach((queriedReminder, index) => {
      const unvalidatedReminderDictForQueriedReminder = unvalidatedReminderDictsForPromises[index];

      if (queriedReminder === undefined || queriedReminder === null) {
        // If queriedReminder doesn't exist, then a reminder corresponding to that reminderUUID doesn't exist yet.
        req.houndProperties.unvalidatedVars.unvalidatedRemindersDict.push(unvalidatedReminderDictForQueriedReminder);
        return;
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogUUID === queriedReminder.dogUUID) <= -1) {
        throw new HoundError(
          'Reminder has invalid permissions',
          validateReminderUUID,
          ERROR_CODES.PERMISSION.NO.REMINDER,
          undefined,
          `
          index ${index};
          validatedDogs.length ${validatedDogs.length}; masterUnvalidatedRemindersDict.length ${masterUnvalidatedRemindersDict.length};
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

      // reminderUUID has been validated. Save it to validatedVars
      req.houndProperties.validatedVars.validatedReminders.push(
        {
          validatedDogUUID: queriedReminder.dogUUID,
          validatedReminderId: queriedReminder.reminderId,
          validatedReminderUUID: queriedReminder.reminderUUID,
          unvalidatedReminderDict: unvalidatedReminderDictForQueriedReminder,
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
    const { validatedDogs } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateTriggerUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateTriggerUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedTriggersDict = formatArray(req.body['dogTriggers'] ?? [req.body]) as (StringKeyDict[] | undefined);

    if (masterUnvalidatedTriggersDict === undefined || masterUnvalidatedTriggersDict === null) {
      return next();
    }

    // 1:1 arrays of unvalidatedTriggersDict and getTriggerForTriggerUUID promise.
    const triggerPromises: Promise<DogTriggersRow | undefined>[] = [];
    const unvalidatedTriggerDictsForPromises: StringKeyDict[] = [];

    // query for all triggers provided
    masterUnvalidatedTriggersDict.forEach((unvalidatedTriggerDict) => {
      const triggerUUID = formatUnknownString(unvalidatedTriggerDict['triggerUUID']);

      if (triggerUUID === undefined || triggerUUID === null) {
        // If triggerUUID is missing, the trigger body wasn't provided
        req.houndProperties.unvalidatedVars.unvalidatedTriggersDict.push(unvalidatedTriggerDict);
        return;
      }

      triggerPromises.push(getTriggerForTriggerUUID(databaseConnection, triggerUUID, true));
      unvalidatedTriggerDictsForPromises.push(unvalidatedTriggerDict);
    });

    const queriedTriggers = await Promise.all(triggerPromises);

    queriedTriggers.forEach((queriedTrigger, index) => {
      const unvalidatedTriggerDictForQueriedTrigger = unvalidatedTriggerDictsForPromises[index];

      if (queriedTrigger === undefined || queriedTrigger === null) {
        // If queriedTrigger doesn't exist, then a trigger corresponding to that triggerUUID doesn't exist yet.
        req.houndProperties.unvalidatedVars.unvalidatedTriggersDict.push(unvalidatedTriggerDictForQueriedTrigger);
        return;
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogUUID === queriedTrigger.dogUUID) <= -1) {
        throw new HoundError(
          'Trigger has invalid permissions',
          validateTriggerUUID,
          ERROR_CODES.PERMISSION.NO.TRIGGER,
          undefined,
          `
          index ${index};
          validatedDogs.length ${validatedDogs.length}; masterUnvalidatedTriggersDict.length ${masterUnvalidatedTriggersDict.length};
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

      // triggerUUID has been validated. Save it to validatedVars
      req.houndProperties.validatedVars.validatedTriggers.push(
        {
          validatedDogUUID: queriedTrigger.dogUUID,
          validatedTriggerId: queriedTrigger.triggerId,
          validatedTriggerUUID: queriedTrigger.triggerUUID,
          unvalidatedTriggerDict: unvalidatedTriggerDictForQueriedTrigger,
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
