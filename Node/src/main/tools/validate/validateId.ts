import express from 'express';
import { addFamilyIdToLogRequest, addUserIdToLogRequest } from '../../logging/logRequest.js';
import { databaseQuery } from '../../database/databaseQuery.js';
import {
  formatUnknownString, formatNumber, formatArray,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';
import { hash } from '../../format/hash.js';

import { updateUserForUserIdentifierHashedUserIdentifier } from '../../../controllers/updateFor/updateForUser.js';
import { type PublicUsersRow, publicUsersColumns } from '../../types/UsersRow.js';
import { type FamilyMembersRow, familyMembersColumns } from '../../types/FamilyMembersRow.js';
import { type DogsRow, dogsColumns } from '../../types/DogsRow.js';
import { type DogLogsRow, dogLogsColumns } from '../../types/DogLogsRow.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../types/DogRemindersRow.js';
import { type StringKeyDictionary } from '../../types/StringKeyDictionary.js';

async function validateUserIdentifier(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    // TODO FUTURE depeciate req.query userIdentifier, last used <= 3.0.0
    // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
    const userIdentifier = formatUnknownString(req.headers['houndheader-useridentifier']) ?? formatUnknownString(req.query['userIdentifier']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateUserIdentifier, ERROR_CODES.VALUE.INVALID);
    }
    if (userIdentifier === undefined || userIdentifier === null) {
      throw new HoundError('userIdentifier missing', validateUserIdentifier, ERROR_CODES.VALUE.INVALID);
    }

    // we are verifying that a user is able to use the provided userId, and to do so they must know the corresponding secret (the userIdentifier)
    const regularResult = await databaseQuery<PublicUsersRow[]>(
      databaseConnection,
      `SELECT ${publicUsersColumns}
        FROM users u
        WHERE userIdentifier = ?
        LIMIT 1`,
      [userIdentifier],
    );

    let user = regularResult.safeIndex(0);

    if (user === undefined || user === null) {
      const hashedUserIdentifier = hash(userIdentifier);
      // If we can't find a user for a userIdentifier, hash that userIdentifier and then try again.
      // This is because we switched from hashing the Apple provided userIdentifier to directly storing it.
      // If query is successful, change saved userIdentifier and return result

      const hashedResult = await databaseQuery<PublicUsersRow[]>(
        databaseConnection,
        `SELECT ${publicUsersColumns}
            FROM users u
            WHERE userIdentifier = ?
            LIMIT 1`,
        [hashedUserIdentifier],
      );

      user = hashedResult.safeIndex(0);

      if (user !== undefined && user !== null) {
        await updateUserForUserIdentifierHashedUserIdentifier(
          databaseConnection,
          userIdentifier,
          hashedUserIdentifier,
        );
      }
    }

    // Its acceptable for user to be undefined. This is because the request could be creating a user.

    req.houndDeclarationExtendedProperties.validatedVariables.validatedUserIdentifier = userIdentifier;
  }
  catch (error) {
    // couldn't query database to find userId
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateUserId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserIdentifier } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateUserId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserIdentifier === undefined || validatedUserIdentifier === null) {
      throw new HoundError('validatedUserIdentifier missing', validateUserId, ERROR_CODES.VALUE.INVALID);
    }

    // we are verifying that a user is able to use the provided userId, and to do so they must know the corresponding secret (the userIdentifier)
    const result = await databaseQuery<PublicUsersRow[]>(
      databaseConnection,
      `SELECT ${publicUsersColumns}
        FROM users u
        WHERE userIdentifier = ?
        LIMIT 1`,
      [validatedUserIdentifier],
    );

    const userId = result.safeIndex(0)?.userId;

    if (userId === undefined || userId === null) {
      // userId does not exist in the table
      return next();
    }

    req.houndDeclarationExtendedProperties.validatedVariables.validatedUserId = userId;
    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);
    if (requestId !== undefined && requestId !== null) {
      addUserIdToLogRequest(requestId, userId);
    }
  }
  catch (error) {
    // couldn't query database to find userId
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateFamilyId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateFamilyId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', validateFamilyId, ERROR_CODES.PERMISSION.NO.USER);
    }

    // queries the database to find familyIds associated with the userId
    const result = await databaseQuery<FamilyMembersRow[]>(
      databaseConnection,
      `SELECT ${familyMembersColumns}
              FROM familyMembers fm
              WHERE userId = ?
              LIMIT 1`,
      [validatedUserId],
    );

    const familyId = result.safeIndex(0)?.familyId;

    if (familyId === undefined || familyId === null) {
      // familyId does not exist in the table
      return next();
    }

    req.houndDeclarationExtendedProperties.validatedVariables.validatedFamilyId = familyId;
    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);
    if (requestId !== undefined && requestId !== null) {
      addFamilyIdToLogRequest(requestId, familyId);
    }
  }
  catch (error) {
    // couldn't query database to find familyId
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

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
    // TODO FUTURE remove backwards compatibility for .params <= 3.0.0
    const paramsDogId = formatNumber(req.params['dogId']);
    if (paramsDogId !== undefined && paramsDogId !== null) {
      dogsDictionary = dogsDictionary ?? formatArray([{ paramsDogId }]) as (StringKeyDictionary[] | undefined);
    }
    // Check to make sure req.body isn't {}
    if (Object.keys(req.body).length > 0) {
      dogsDictionary = dogsDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
    }

    console.log(dogsDictionary);

    if (dogsDictionary === undefined || dogsDictionary === null) {
      // We have no dogIds to validate
      return next();
    }

    const promises: Promise<DogsRow[]>[] = [];
    // query for all reminders provided
    dogsDictionary.forEach((dogDictionary) => {
      const dogId = formatNumber(dogDictionary['dogId']);

      if (dogId === undefined || dogId === null || dogId === -1) {
        // If dogId is missing or -1, it means a dog body could have been provided, but we are creating the dog
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

      console.log(dogsDictionary);
      console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs);
      // dogId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs.push(
        {
          validatedDogId: queriedDog.dogId,
          unvalidatedDogDictionary: dogsDictionary?.find((unvalidatedDogDictionary) => formatNumber(unvalidatedDogDictionary['dogId']) === queriedDog.dogId),
        },
      );
      console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedDogs);
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
    const paramsLogId = formatNumber(req.params['logId']);
    if (paramsLogId !== undefined && paramsLogId !== null) {
      logsDictionary = logsDictionary ?? formatArray([{ paramsLogId }]) as (StringKeyDictionary[] | undefined);
    }
    // Check to make sure req.body isn't {}
    if (Object.keys(req.body).length > 0) {
      logsDictionary = logsDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
    }

    console.log(logsDictionary);

    if (logsDictionary === undefined || logsDictionary === null) {
      // We have no logIds to validate
      return next();
    }

    const promises: Promise<DogLogsRow[]>[] = [];
    // query for all logs provided
    logsDictionary.forEach((logDictionary) => {
      const logId = formatNumber(logDictionary['logId']);

      if (logId === undefined || logId === null || logId === -1) {
        // If logId is missing or -1, it means a log body could have been provided, but we are creating the log
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

      console.log(logsDictionary);
      console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs);
      // logId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs.push(
        {
          validatedDogId: queriedLog.dogId,
          validatedLogId: queriedLog.logId,
          unvalidatedLogDictionary: logsDictionary?.find((unvalidatedLogDictionary) => formatNumber(unvalidatedLogDictionary['logId']) === queriedLog.logId),
        },
      );
      console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedLogs);
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
    const paramsReminderId = formatNumber(req.params['reminderId']);
    if (paramsReminderId !== undefined && paramsReminderId !== null) {
      remindersDictionary = remindersDictionary ?? formatArray([{ paramsReminderId }]) as (StringKeyDictionary[] | undefined);
    }
    // Check to make sure req.body isn't {}
    if (Object.keys(req.body).length > 0) {
      remindersDictionary = remindersDictionary ?? formatArray([req.body]) as (StringKeyDictionary[] | undefined);
    }

    console.log(remindersDictionary);

    if (remindersDictionary === undefined || remindersDictionary === null) {
      // We have no reminderIds to validate
      return next();
    }

    const promises: Promise<DogRemindersRow[]>[] = [];
    // query for all reminders provided
    remindersDictionary.forEach((reminderDictionary) => {
      const reminderId = formatNumber(reminderDictionary['reminderId']);

      if (reminderId === undefined || reminderId === null || reminderId === -1) {
        // If reminderId is missing or -1, it means a reminder body could have been provided, but we are creating the reminder
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

      console.log(remindersDictionary);
      console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders);
      // reminderId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders.push(
        {
          validatedDogId: queriedReminder.dogId,
          validatedReminderId: queriedReminder.reminderId,
          unvalidatedReminderDictionary: remindersDictionary?.find((unvalidatedReminderDictionary) => formatNumber(unvalidatedReminderDictionary['reminderId']) === queriedReminder.reminderId),
        },
      );
      console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  console.log(req.houndDeclarationExtendedProperties.validatedVariables.validatedReminders);
  return next();
}

export {
  validateUserIdentifier, validateUserId, validateFamilyId, validateDogId, validateLogId, validateReminderId,
};
