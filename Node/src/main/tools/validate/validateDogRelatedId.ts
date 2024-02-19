import express from 'express';
import {
  formatNumber, formatArray, formatUnknownString,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';

import { type DogsRow } from '../../types/DogsRow.js';
import { type DogLogsRow } from '../../types/DogLogsRow.js';
import { type DogRemindersRow } from '../../types/DogRemindersRow.js';
import { type StringKeyDictionary } from '../../types/StringKeyDictionary.js';
import { getDogForDogIdUUID } from '../../../controllers/getFor/getForDogs.js';
import { getLogForLogIdUUID } from '../../../controllers/getFor/getForLogs.js';
import { getReminderForReminderIdUUID } from '../../../controllers/getFor/getForReminders.js';

// TODO DEPRECIATE < 3.4.0. switch from dogId/reminderId/logId to uuids for verification, identification, and other stuff.

async function validateDogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateDogId, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateDogId, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogsDictionary = formatArray(req.body['dogs'] ?? req.body['reminders'] ?? req.body['logs'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (dogsDictionary === undefined || dogsDictionary === null) {
      // We have no dogIds to validate
      return next();
    }

    // 1:1 arrays of unvalidatedDogsDictionary and getDogForDogIdUUID promise.
    const dogPromises: Promise<DogsRow | undefined>[] = [];
    const dogDictionaries: StringKeyDictionary[] = [];

    // query for all dogs provided
    dogsDictionary.forEach((dogDictionary) => {
      // TODO DEPRECIATE < 3.4.0. After that version, dogUUID will always be provided for all types of requests, but dogId won't.
      const dogId = formatNumber(dogDictionary['dogId']);
      const dogUUID = formatUnknownString(dogDictionary['dogUUID']);

      if ((dogUUID === undefined || dogUUID === null) && (dogId === undefined || dogId === null || dogId <= -1)) {
        // If dogUUID and dogId are missing, it either a dog body wasn't provided or it was provided but dogId is invalid because the dog is yet to be created
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedDogsDictionary.push(dogDictionary);
        return;
      }

      // Add these objects to verify to an array. We resolve the promise and use dogDictionary if the promise resolved to nothing.
      dogPromises.push(getDogForDogIdUUID(databaseConnection, true, false, undefined, dogId, dogUUID));
      dogDictionaries.push(dogDictionary);
    });

    const queriedDogs = await Promise.all(dogPromises);

    queriedDogs.forEach((queriedDog, index) => {
      const dogDictionary = dogDictionaries[index];

      if (queriedDog === undefined || queriedDog === null) {
        // If queriedDog doesn't exist, then a dog corresponding to that dogUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedDogsDictionary.push(dogDictionary);
        return;
      }

      if (validatedFamilyId !== queriedDog.familyId) {
        throw new HoundError(
          'Dog has invalid permissions',
          validateDogId,
          ERROR_CODES.PERMISSION.NO.DOG,
        );
      }

      if (queriedDog.dogIsDeleted === 1) {
        throw new HoundError('Dog has been deleted', validateDogId, ERROR_CODES.FAMILY.DELETED.DOG);
      }

      // dogId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs.push(
        {
          validatedDogId: queriedDog.dogId,
          validatedDogUUID: queriedDog.dogUUID,
          unvalidatedDogDictionary: dogsDictionary?.find((unvalidatedDogDictionary) => formatNumber(unvalidatedDogDictionary['dogId']) === queriedDog.dogId),
        },
      );
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateLogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateLogId, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateLogId, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logsDictionary = formatArray(req.body['logs'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (logsDictionary === undefined || logsDictionary === null) {
      // We have no logIds to validate
      return next();
    }

    // 1:1 arrays of unvalidatedLogsDictionary and getLogForLogIdUUID promise.
    const logPromises: Promise<DogLogsRow | undefined>[] = [];
    const logDictionaries: StringKeyDictionary[] = [];

    // query for all logs provided
    logsDictionary.forEach((logDictionary) => {
      // TODO DEPRECIATE < 3.4.0. After that version, logUUID will always be provided for all types of requests, but logId won't.
      const logId = formatNumber(logDictionary['logId']);
      const logUUID = formatUnknownString(logDictionary['logUUID']);

      if ((logUUID === undefined || logUUID == null) && (logId === undefined || logId === null || logId <= -1)) {
        // If logId is missing or -1, it either a log body wasn't provided or it was provided but logId is invalid because the log is yet to be created
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedLogsDictionary.push(logDictionary);
        return;
      }

      logPromises.push(getLogForLogIdUUID(databaseConnection, true, logId, logUUID));
      logDictionaries.push(logDictionary);
    });

    const queriedLogs = await Promise.all(logPromises);

    queriedLogs.forEach((queriedLog, index) => {
      const logDictionary = logDictionaries[index];

      if (queriedLog === undefined || queriedLog === null) {
        // If queriedLog doesn't exist, then a log corresponding to that logUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedLogsDictionary.push(logDictionary);
        return;
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogId === queriedLog.dogId) === -1) {
        throw new HoundError('Log has invalid permissions', validateLogId, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (queriedLog.logIsDeleted === 1) {
        throw new HoundError('Log has been deleted', validateLogId, ERROR_CODES.FAMILY.DELETED.LOG);
      }

      // logId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs.push(
        {
          validatedDogId: queriedLog.dogId,
          validatedLogId: queriedLog.logId,
          validatedLogUUID: queriedLog.logUUID,
          unvalidatedLogDictionary: logsDictionary?.find((unvalidatedLogDictionary) => formatNumber(unvalidatedLogDictionary['logId']) === queriedLog.logId),
        },
      );
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateReminderId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateReminderId, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateReminderId, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (StringKeyDictionary[] | undefined);

    if (remindersDictionary === undefined || remindersDictionary === null) {
      // We have no reminderIds to validate
      return next();
    }

    // 1:1 arrays of unvalidatedRemindersDictionary and getReminderForReminderIdUUID promise.
    const reminderPromises: Promise<DogRemindersRow | undefined>[] = [];
    const reminderDictionaries: StringKeyDictionary[] = [];

    // query for all reminders provided
    remindersDictionary.forEach((reminderDictionary) => {
      // TODO DEPRECIATE < 3.4.0. After that version, reminderUUID will always be provided for all types of requests, but reminderId won't.
      const reminderId = formatNumber(reminderDictionary['reminderId']);
      const reminderUUID = formatUnknownString(reminderDictionary['reminderUUID']);

      if ((reminderUUID === undefined || reminderUUID === null) && (reminderId === undefined || reminderId === null || reminderId <= -1)) {
        // If reminderId is missing or -1, it either a reminder body wasn't provided or it was provided but reminderId is invalid because the reminder is yet to be created
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedRemindersDictionary.push(reminderDictionary);
        return;
      }

      reminderPromises.push(getReminderForReminderIdUUID(databaseConnection, true, reminderId, reminderUUID));
      reminderDictionaries.push(reminderDictionary);
    });

    const queriedReminders = await Promise.all(reminderPromises);

    queriedReminders.forEach((queriedReminder, index) => {
      const reminderDictionary = reminderDictionaries[index];

      if (queriedReminder === undefined || queriedReminder === null) {
        // If queriedReminder doesn't exist, then a reminder corresponding to that reminderUUID doesn't exist yet.
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedRemindersDictionary.push(reminderDictionary);
        return;
      }

      if (queriedReminder === undefined || queriedReminder === null) {
        // the reminderId does not exist and/or the dog does not have access to that reminderId
        throw new HoundError('Reminder could not be located', validateReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogId === queriedReminder.dogId) <= -1) {
        throw new HoundError('Reminder has invalid permissions', validateReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
      }

      if (queriedReminder.reminderIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Reminder has been deleted', validateReminderId, ERROR_CODES.FAMILY.DELETED.REMINDER);
      }

      // reminderId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders.push(
        {
          validatedDogId: queriedReminder.dogId,
          validatedReminderId: queriedReminder.reminderId,
          validatedReminderUUID: queriedReminder.reminderUUID,
          unvalidatedReminderDictionary: remindersDictionary?.find((unvalidatedReminderDictionary) => formatNumber(unvalidatedReminderDictionary['reminderId']) === queriedReminder.reminderId),
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
  validateDogId, validateLogId, validateReminderId,
};
