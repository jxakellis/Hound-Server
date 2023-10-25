import express from 'express';
import { databaseQuery } from '../../database/databaseQuery.js';
import {
  formatNumber, formatArray,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';

import { type DogsRow, dogsColumns } from '../../types/DogsRow.js';
import { type DogLogsRow, dogLogsColumns } from '../../types/DogLogsRow.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../types/DogRemindersRow.js';
import { type StringKeyDictionary } from '../../types/StringKeyDictionary.js';

async function validateDogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateDogId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateDogId, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let dogsDictionary = formatArray(req.body['dogs'] ?? req.body['reminders'] ?? req.body['logs']) as (StringKeyDictionary[] | undefined);
    console.log(1, dogsDictionary);
    // TODO FUTURE remove backwards compatibility for .params <= 3.0.0
    const paramsDogId = formatNumber(req.params['dogId']);
    console.log(req.params, paramsDogId);
    if (paramsDogId !== undefined && paramsDogId !== null) {
      if (dogsDictionary !== undefined && dogsDictionary !== null) {
        dogsDictionary = dogsDictionary.map((dogDictionary) => ({ ...dogDictionary, dogId: paramsDogId }));
        console.log(2, dogsDictionary);
      }
      else {
        dogsDictionary = [{ dogId: paramsDogId }];
        console.log(3, dogsDictionary);
      }
    }
    // Check to make sure req.body isn't {}
    else if (Object.keys(req.body).length > 0) {
      dogsDictionary = dogsDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
      console.log(4, dogsDictionary);
    }

    console.log('\ndogsDictionary at start', dogsDictionary);

    if (dogsDictionary === undefined || dogsDictionary === null) {
      // We have no dogIds to validate
      return next();
    }

    const promises: Promise<DogsRow[]>[] = [];
    // query for all reminders provided
    dogsDictionary.forEach((dogDictionary) => {
      const dogId = formatNumber(dogDictionary['dogId']);

      if (dogId === undefined || dogId === null || dogId === -1) {
        // If dogId is missing or -1, it either a dog body wasn't provided or it was provided but dogId is invalid because the dog is yet to be created
        console.log('\ndogDictionary being added to unvalidatedDogsDictionary', dogDictionary);
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedDogsDictionary.push(dogDictionary);
        return;
      }

      // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
      promises.push(databaseQuery<DogsRow[]>(
        databaseConnection,
        `SELECT ${dogsColumns}
                  FROM dogs d
                  WHERE d.dogId = ?
                  LIMIT 1`,
        [dogId],
      ));
    });

    const queriedDogs = await Promise.all(promises);

    queriedDogs.forEach((queriedDogResult) => {
      const queriedDog = queriedDogResult.safeIndex(0);

      if (queriedDog === undefined || queriedDog === null) {
        // eslint-disable-next-line no-await-in-loop
        throw new HoundError('Dog could not be located', validateDogId, ERROR_CODES.PERMISSION.NO.DOG);
      }

      if (validatedFamilyId !== queriedDog.familyId) {
        throw new HoundError('Dog has invalid permissions', validateDogId, ERROR_CODES.PERMISSION.NO.DOG);
      }

      if (queriedDog.dogIsDeleted === 1) {
        throw new HoundError('Dog has been deleted', validateDogId, ERROR_CODES.FAMILY.DELETED.DOG);
      }

      console.log('\nvalidatedDogs before', req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs);
      // dogId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs.push(
        {
          validatedDogId: queriedDog.dogId,
          unvalidatedDogDictionary: dogsDictionary?.find((unvalidatedDogDictionary) => formatNumber(unvalidatedDogDictionary['dogId']) === queriedDog.dogId),
        },
      );
      console.log('\n validatedDogs before', req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  console.log('\n validatedDogs final', req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs);
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
      throw new HoundError('databaseConnection missing', validateLogId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateLogId, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let logsDictionary = formatArray(req.body['logs']) as (StringKeyDictionary[] | undefined);
    const paramsDogId = formatNumber(req.params['dogId']);
    const paramsLogId = formatNumber(req.params['logId']);
    if (paramsDogId !== undefined && paramsDogId !== null && paramsLogId !== undefined && paramsLogId !== null) {
      if (logsDictionary !== undefined && logsDictionary !== null) {
        logsDictionary = logsDictionary.map((logDictionary) => ({ ...logDictionary, dogId: paramsDogId, logId: paramsLogId }));
      }
      else {
        logsDictionary = [{ dogId: paramsDogId, logId: paramsLogId }];
      }
    }
    // Check to make sure req.body isn't {}
    else if (Object.keys(req.body).length > 0) {
      logsDictionary = logsDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
    }

    console.log('\nlogsDictionary at start', logsDictionary);

    if (logsDictionary === undefined || logsDictionary === null) {
      // We have no logIds to validate
      return next();
    }

    const promises: Promise<DogLogsRow[]>[] = [];
    // query for all logs provided
    logsDictionary.forEach((logDictionary) => {
      const logId = formatNumber(logDictionary['logId']);

      if (logId === undefined || logId === null || logId === -1) {
        // If logId is missing or -1, it either a log body wasn't provided or it was provided but logId is invalid because the log is yet to be created
        console.log('\nlogDictionary being added to unvalidatedLogsDictionary', logDictionary);
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedLogsDictionary.push(logDictionary);
        return;
      }

      // Attempt to locate a log. It must match the logId provided while being attached to a dog that the user has permission to use
      promises.push(databaseQuery<DogLogsRow[]>(
        databaseConnection,
        `SELECT ${dogLogsColumns}
                    FROM dogLogs dl
                    WHERE dl.logId = ?
                    LIMIT 1`,
        [logId],
      ));
    });

    const queriedLogs = await Promise.all(promises);

    queriedLogs.forEach((queriedLogResult) => {
      const queriedLog = queriedLogResult.safeIndex(0);

      if (queriedLog === undefined || queriedLog === null) {
        // eslint-disable-next-line no-await-in-loop
        throw new HoundError('Log could not be located', validateLogId, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogId === queriedLog.dogId) === -1) {
        throw new HoundError('Log has invalid permissions', validateLogId, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (queriedLog.logIsDeleted === 1) {
        throw new HoundError('Log has been deleted', validateLogId, ERROR_CODES.FAMILY.DELETED.LOG);
      }

      console.log('\nvalidatedLogs before', req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs);
      // logId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs.push(
        {
          validatedDogId: queriedLog.dogId,
          validatedLogId: queriedLog.logId,
          unvalidatedLogDictionary: logsDictionary?.find((unvalidatedLogDictionary) => formatNumber(unvalidatedLogDictionary['logId']) === queriedLog.logId),
        },
      );
      console.log('\nvalidatedLogs after', req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  console.log('\nvalidatedLogs final', req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs);
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
      throw new HoundError('databaseConnection missing', validateReminderId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogs === undefined || validatedDogs === null) {
      throw new HoundError('validatedDogs missing', validateReminderId, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let remindersDictionary = formatArray(req.body['reminders']) as (StringKeyDictionary[] | undefined);
    const paramsDogId = formatNumber(req.params['dogId']);
    const paramsReminderId = formatNumber(req.params['reminderId']);

    if (paramsDogId !== undefined && paramsDogId !== null && paramsReminderId !== undefined && paramsReminderId !== null) {
      if (remindersDictionary !== undefined && remindersDictionary !== null) {
        remindersDictionary = remindersDictionary.map((reminderDictionary) => ({ ...reminderDictionary, dogId: paramsDogId, reminderId: paramsReminderId }));
      }
      else {
        remindersDictionary = [{ dogId: paramsDogId, reminderId: paramsReminderId }];
      }
    }
    // Check to make sure req.body isn't {}
    else if (Object.keys(req.body).length > 0) {
      remindersDictionary = remindersDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
    }

    if (paramsReminderId !== undefined && paramsReminderId !== null) {
      remindersDictionary = remindersDictionary ?? formatArray([{ paramsReminderId }]) as (StringKeyDictionary[] | undefined);
    }
    // Check to make sure req.body isn't {}
    if (Object.keys(req.body).length > 0) {
      remindersDictionary = remindersDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
    }

    console.log('\nremindersDictionary at start', remindersDictionary);

    if (remindersDictionary === undefined || remindersDictionary === null) {
      // We have no reminderIds to validate
      return next();
    }

    const promises: Promise<DogRemindersRow[]>[] = [];
    // query for all reminders provided
    remindersDictionary.forEach((reminderDictionary) => {
      const reminderId = formatNumber(reminderDictionary['reminderId']);

      if (reminderId === undefined || reminderId === null || reminderId === -1) {
        // If reminderId is missing or -1, it either a reminder body wasn't provided or it was provided but reminderId is invalid because the reminder is yet to be created
        console.log('\nreminderDictionary being added to unvalidatedRemindersDictionary', reminderDictionary);
        req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedRemindersDictionary.push(reminderDictionary);
        return;
      }

      // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
      promises.push(databaseQuery<DogRemindersRow[]>(
        databaseConnection,
        `SELECT ${dogRemindersColumns}
                        FROM dogReminders dr
                        WHERE dr.reminderId = ?
                        LIMIT 1`,
        [reminderId],
      ));
    });

    const queriedReminders = await Promise.all(promises);

    queriedReminders.forEach((queriedReminderResult) => {
      const queriedReminder = queriedReminderResult.safeIndex(0);

      if (queriedReminder === undefined || queriedReminder === null) {
        // the reminderId does not exist and/or the dog does not have access to that reminderId
        // eslint-disable-next-line no-await-in-loop
        throw new HoundError('Reminder could not be located', validateReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
      }

      if (validatedDogs.findIndex((dog) => dog.validatedDogId === queriedReminder.dogId) === -1) {
        throw new HoundError('Reminder has invalid permissions', validateReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
      }

      if (queriedReminder.reminderIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Reminder has been deleted', validateReminderId, ERROR_CODES.FAMILY.DELETED.REMINDER);
      }

      console.log('\nvalidatedReminders before', req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders);
      // reminderId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders.push(
        {
          validatedDogId: queriedReminder.dogId,
          validatedReminderId: queriedReminder.reminderId,
          unvalidatedReminderDictionary: remindersDictionary?.find((unvalidatedReminderDictionary) => formatNumber(unvalidatedReminderDictionary['reminderId']) === queriedReminder.reminderId),
        },
      );
      console.log('\nvalidatedReminders after', req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  console.log('\n\validatedReminders final', req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders);
  return next();
}

export {
  validateDogId, validateLogId, validateReminderId,
};
