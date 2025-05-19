import express from 'express';
import {
  formatArray, formatUnknownString,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';

import { type DogsRow } from '../../types/DogsRow.js';
import { type DogLogsRow } from '../../types/DogLogsRow.js';
import { type DogRemindersRow } from '../../types/DogRemindersRow.js';
import { type StringKeyDictionary } from '../../types/StringKeyDictionary.js';
import { getDogForDogUUID } from '../../../controllers/get/getDogs.js';
import { getLogForLogUUID } from '../../../controllers/get/getLogs.js';
import { getReminderForReminderUUID } from '../../../controllers/get/getReminders.js';
import { type DogTriggersRow } from '../../types/DogTriggersRow.js';
import { getTriggerForTriggerUUID } from '../../../controllers/get/triggers/getTriggers.js';

async function validateDogUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateDogUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateDogUUID, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedDogsDictionary = formatArray(req.body['dogs'] ?? req.body['reminders'] ?? req.body['logs'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (masterUnvalidatedDogsDictionary === undefined || masterUnvalidatedDogsDictionary === null) {
      // We have no dogUUIDs to validate
      return next();
    }

    // 1:1 arrays of unvalidatedDogsDictionary and getDogForDogUUID promise.
    const dogPromises: Promise<DogsRow | undefined>[] = [];
    const unvalidatedDogDictionariesForPromises: StringKeyDictionary[] = [];

    // query for all dogs provided
    masterUnvalidatedDogsDictionary.forEach((unvalidatedDogDictionary) => {
      const dogUUID = formatUnknownString(unvalidatedDogDictionary['dogUUID']);

      if (dogUUID === undefined || dogUUID === null) {
        // If dogUUID is missing, the dog body wasn't provided
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedDogsDictionary.push(unvalidatedDogDictionary);
        return;
      }

      // Add these objects to verify to an array. We resolve the promise and use unvalidatedDogDictionary if the promise resolved to nothing.
      dogPromises.push(getDogForDogUUID(databaseConnection, dogUUID, true, false, undefined));
      unvalidatedDogDictionariesForPromises.push(unvalidatedDogDictionary);
    });

    const queriedDogs = await Promise.all(dogPromises);

    queriedDogs.forEach((queriedDog, index) => {
      const unvalidatedDogDictionaryForQueriedDog = unvalidatedDogDictionariesForPromises[index];

      if (queriedDog === undefined || queriedDog === null) {
        // If queriedDog doesn't exist, then a dog corresponding to that dogUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedDogsDictionary.push(unvalidatedDogDictionaryForQueriedDog);
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

      // dogUUID has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs.push(
        {
          validatedDogId: queriedDog.dogId,
          validatedDogUUID: queriedDog.dogUUID,
          unvalidatedDogDictionary: unvalidatedDogDictionaryForQueriedDog,
        },
      );
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateLogUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateLogUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateLogUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedLogsDictionary = formatArray(req.body['logs'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (masterUnvalidatedLogsDictionary === undefined || masterUnvalidatedLogsDictionary === null) {
      return next();
    }

    // 1:1 arrays of unvalidatedLogsDictionary and getLogForLogUUID promise.
    const logPromises: Promise<DogLogsRow | undefined>[] = [];
    const unvalidatedLogDictionariesForPromises: StringKeyDictionary[] = [];

    // query for all logs provided
    masterUnvalidatedLogsDictionary.forEach((unvalidatedLogDictionary) => {
      const logUUID = formatUnknownString(unvalidatedLogDictionary['logUUID']);

      if (logUUID === undefined || logUUID == null) {
        // If logUUID is missing, the log body wasn't provided
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedLogsDictionary.push(unvalidatedLogDictionary);
        return;
      }

      logPromises.push(getLogForLogUUID(databaseConnection, logUUID, true));
      unvalidatedLogDictionariesForPromises.push(unvalidatedLogDictionary);
    });

    const queriedLogs = await Promise.all(logPromises);

    queriedLogs.forEach((queriedLog, index) => {
      const unvalidatedLogDictionaryForQueriedLog = unvalidatedLogDictionariesForPromises[index];

      if (queriedLog === undefined || queriedLog === null) {
        // If queriedLog doesn't exist, then a log corresponding to that logUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedLogsDictionary.push(unvalidatedLogDictionaryForQueriedLog);
        return;
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogUUID === queriedLog.dogUUID) === -1) {
        throw new HoundError('Log has invalid permissions', validateLogUUID, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (queriedLog.logIsDeleted === 1) {
        throw new HoundError('Log has been deleted', validateLogUUID, ERROR_CODES.FAMILY.DELETED.LOG);
      }

      // logUUID has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs.push(
        {
          validatedDogUUID: queriedLog.dogUUID,
          validatedLogId: queriedLog.logId,
          validatedLogUUID: queriedLog.logUUID,
          unvalidatedLogDictionary: unvalidatedLogDictionaryForQueriedLog,
        },
      );
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateReminderUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateReminderUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateReminderUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedRemindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (masterUnvalidatedRemindersDictionary === undefined || masterUnvalidatedRemindersDictionary === null) {
      return next();
    }

    // 1:1 arrays of unvalidatedRemindersDictionary and getReminderForReminderUUID promise.
    const reminderPromises: Promise<DogRemindersRow | undefined>[] = [];
    const unvalidatedReminderDictionariesForPromises: StringKeyDictionary[] = [];

    // query for all reminders provided
    masterUnvalidatedRemindersDictionary.forEach((unvalidatedReminderDictionary) => {
      const reminderUUID = formatUnknownString(unvalidatedReminderDictionary['reminderUUID']);

      if (reminderUUID === undefined || reminderUUID === null) {
        // If reminderUUID is missing, the reminder body wasn't provided
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedRemindersDictionary.push(unvalidatedReminderDictionary);
        return;
      }

      reminderPromises.push(getReminderForReminderUUID(databaseConnection, reminderUUID, true));
      unvalidatedReminderDictionariesForPromises.push(unvalidatedReminderDictionary);
    });

    const queriedReminders = await Promise.all(reminderPromises);

    queriedReminders.forEach((queriedReminder, index) => {
      const unvalidatedReminderDictionaryForQueriedReminder = unvalidatedReminderDictionariesForPromises[index];

      if (queriedReminder === undefined || queriedReminder === null) {
        // If queriedReminder doesn't exist, then a reminder corresponding to that reminderUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedRemindersDictionary.push(unvalidatedReminderDictionaryForQueriedReminder);
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
          validatedDogs.length ${validatedDogs.length}; masterUnvalidatedRemindersDictionary.length ${masterUnvalidatedRemindersDictionary.length};
          reminderPromises.length ${reminderPromises.length}; unvalidatedReminderDictionariesForPromises.length ${unvalidatedReminderDictionariesForPromises};
          unvalidatedReminderDictionaryForQueriedReminder.reminderUUID ${unvalidatedReminderDictionaryForQueriedReminder['reminderUUID']};
          queriedReminder.reminderId ${queriedReminder.reminderId}; queriedReminder.reminderUUID ${queriedReminder.reminderUUID}; queriedReminder.dogUUID ${queriedReminder.dogUUID}
          `,
        );
      }

      if (queriedReminder.reminderIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Reminder has been deleted', validateReminderUUID, ERROR_CODES.FAMILY.DELETED.REMINDER);
      }

      // reminderUUID has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders.push(
        {
          validatedDogUUID: queriedReminder.dogUUID,
          validatedReminderId: queriedReminder.reminderId,
          validatedReminderUUID: queriedReminder.reminderUUID,
          unvalidatedReminderDictionary: unvalidatedReminderDictionaryForQueriedReminder,
        },
      );
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateTriggerUUID(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateTriggerUUID, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateTriggerUUID, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const masterUnvalidatedTriggersDictionary = formatArray(req.body['dogTriggers'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (masterUnvalidatedTriggersDictionary === undefined || masterUnvalidatedTriggersDictionary === null) {
      return next();
    }

    // 1:1 arrays of unvalidatedTriggersDictionary and getTriggerForTriggerUUID promise.
    const triggerPromises: Promise<DogTriggersRow | undefined>[] = [];
    const unvalidatedTriggerDictionariesForPromises: StringKeyDictionary[] = [];

    // query for all triggers provided
    masterUnvalidatedTriggersDictionary.forEach((unvalidatedTriggerDictionary) => {
      const triggerUUID = formatUnknownString(unvalidatedTriggerDictionary['triggerUUID']);

      if (triggerUUID === undefined || triggerUUID === null) {
        // If triggerUUID is missing, the trigger body wasn't provided
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedTriggersDictionary.push(unvalidatedTriggerDictionary);
        return;
      }

      triggerPromises.push(getTriggerForTriggerUUID(databaseConnection, triggerUUID, true));
      unvalidatedTriggerDictionariesForPromises.push(unvalidatedTriggerDictionary);
    });

    const queriedTriggers = await Promise.all(triggerPromises);

    queriedTriggers.forEach((queriedTrigger, index) => {
      const unvalidatedTriggerDictionaryForQueriedTrigger = unvalidatedTriggerDictionariesForPromises[index];

      if (queriedTrigger === undefined || queriedTrigger === null) {
        // If queriedTrigger doesn't exist, then a trigger corresponding to that triggerUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedTriggersDictionary.push(unvalidatedTriggerDictionaryForQueriedTrigger);
        return;
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogUUID === queriedTrigger.triggerUUID) <= -1) {
        throw new HoundError(
          'Trigger has invalid permissions',
          validateTriggerUUID,
          ERROR_CODES.PERMISSION.NO.TRIGGER,
          undefined,
          `
          index ${index};
          validatedDogs.length ${validatedDogs.length}; masterUnvalidatedTriggersDictionary.length ${masterUnvalidatedTriggersDictionary.length};
          triggerPromises.length ${triggerPromises.length}; unvalidatedTriggerDictionariesForPromises.length ${unvalidatedTriggerDictionariesForPromises};
          unvalidatedTriggerDictionaryForQueriedTrigger.triggerUUID ${unvalidatedTriggerDictionaryForQueriedTrigger['triggerUUID']};
          queriedTrigger.triggerId ${queriedTrigger.triggerId}; queriedTrigger.triggerUUID ${queriedTrigger.triggerUUID}; queriedTrigger.dogUUID ${queriedTrigger.dogUUID}
          `,
        );
      }

      if (queriedTrigger.triggerIsDeleted === 1) {
        // the trigger has been found but its been deleted
        throw new HoundError('Trigger has been deleted', validateTriggerUUID, ERROR_CODES.FAMILY.DELETED.TRIGGER);
      }

      // triggerUUID has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedTriggers.push(
        {
          validatedDogUUID: queriedTrigger.dogUUID,
          validatedTriggerId: queriedTrigger.triggerId,
          validatedTriggerUUID: queriedTrigger.triggerUUID,
          unvalidatedTriggerDictionary: unvalidatedTriggerDictionaryForQueriedTrigger,
        },
      );
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

export {
  validateDogUUID, validateLogUUID, validateReminderUUID, validateTriggerUUID,
};
