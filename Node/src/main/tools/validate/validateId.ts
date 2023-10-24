import express from 'express';
import { addAppVersionToLogRequest, addFamilyIdToLogRequest, addUserIdToLogRequest } from '../../logging/logRequest.js';
import { databaseQuery } from '../../database/databaseQuery.js';
import {
  formatUnknownString, formatNumber, formatArray,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';
import { hash } from '../../format/hash.js';

import { updateUserForUserIdentifierHashedUserIdentifier } from '../../../controllers/updateFor/updateForUser.js';
import { SERVER } from '../../server/globalConstants.js';
import { type PublicUsersRow, publicUsersColumns } from '../../types/UsersRow.js';
import { type FamilyMembersRow, familyMembersColumns } from '../../types/FamilyMembersRow.js';
import { type DogsRow, dogsColumns } from '../../types/DogsRow.js';
import { type DogLogsRow, dogLogsColumns } from '../../types/DogLogsRow.js';
import { type DogRemindersRow, dogRemindersColumns } from '../../types/DogRemindersRow.js';
import { type Dictionary } from '../../types/Dictionary.js';

/**
* Checks to see that the appVersion of the requester is compatible
*/
async function validateAppVersion(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // TODO NOW bug, not backwards compatible
    // TODO FUTURE depreciate appVersion in params, last used <= 3.0.0
    const appVersion = formatUnknownString(req.params['appVersion']) ?? formatUnknownString(req.headers['houndheader-appversion']);
    console.log('\n\nappVersion', appVersion);
    console.log('req.body', req.body);
    console.log('req.params', req.params);
    console.log('req.url', req.url);

    if (appVersion === undefined || appVersion === null) {
      throw new HoundError('appVersion missing', validateAppVersion, ERROR_CODES.VALUE.MISSING);
    }

    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);

    // We want to add app version even before its validated
    if (requestId !== undefined && requestId !== null) {
      addAppVersionToLogRequest(requestId, appVersion);
    }

    // the user isn't on the previous or current app version
    if (SERVER.COMPATIBLE_IOS_APP_VERSIONS.includes(appVersion) === false) {
      throw new HoundError(
        `App version of ${appVersion} is incompatible. Compatible version(s): ${SERVER.COMPATIBLE_IOS_APP_VERSIONS}`,
        validateAppVersion,
        ERROR_CODES.GENERAL.APP_VERSION_OUTDATED,
      );
    }
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

/**
  * Checks to see that userId and userIdentifier are defined, are valid, and exist in the database.
  */
async function validateUserIdentifier(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    // TODO FUTURE depeciate req.query userIdentifier, last used <= 3.0.0
    // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
    const userIdentifier = formatUnknownString(req.query['userIdentifier']) ?? formatUnknownString(req.headers['houndheader-useridentifier']);
    console.log('\n\nuserIdentifier', userIdentifier);
    console.log('req.body', req.body);
    console.log('req.params', req.params);
    console.log('req.url', req.url);

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

/**
  * Checks to see that userId and userIdentifier are defined, are valid, and exist in the database.
  */
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

/**
        * Checks to see that familyId is defined, is a number, and exists in the database
        */
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

/**
          * Checks to see that dogId is defined, a number, and exists in the database under familyId provided. Dog can be deleted.
          * If it does then the user owns the dog and invokes next().
          */
async function validateDogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // TODO NOW cntrl f for dog, reminder, and log (case insenitive), if found in wrong validateBody (because I copy pasted), fix it
    // TODO NOW for validateDogId, remidnerId, and logId, have it validate through the body method.
    // Follow the general path layed out by validateBodyReminderId
    // Remember to ?? in params.someId to be backwards compatible.

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
    const dogsDictionary = formatArray(req.body['dogs'] ?? req.body['reminders'] ?? req.body['logs'] ?? [req.body] ?? [{ dogId: req.params['dogId'] }]) as (Dictionary[] | undefined);
    console.log('\n\ndogsDictionary', dogsDictionary);
    console.log('req.body', req.body);
    console.log('req.params', req.params);
    console.log('req.url', req.url);

    if (dogsDictionary === undefined || dogsDictionary === null) {
      throw new HoundError('dogsDictionary missing', validateDogId, ERROR_CODES.VALUE.INVALID);
    }

    const promises: Promise<DogsRow[]>[] = [];
    // query for all reminders provided
    dogsDictionary.forEach((dogDictionary) => {
      const dogId = formatNumber(dogDictionary['dogId']);

      if (dogId === undefined || dogId === null) {
        throw new HoundError('dogId missing', validateDogId, ERROR_CODES.VALUE.INVALID);
      }

      // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
      promises.push(databaseQuery<DogsRow[]>(
        databaseConnection,
        `SELECT ${dogsColumns}
                  FROM dogs d
                  JOIN families f ON d.familyId = f.familyId
                  WHERE d.familyId = ? AND d.dogId = ?
                  LIMIT 1`,
        [validatedFamilyId, dogId],
      ));
    });

    const queriedDogs = await Promise.all(promises);

    queriedDogs.forEach((queriedDogResult) => {
      const queriedDog = queriedDogResult.safeIndex(0);

      if (queriedDog === undefined || queriedDog === null) {
        // the dogId does not exist and/or the dog does not have access to that dogId
        // eslint-disable-next-line no-await-in-loop
        throw new HoundError('No dog found or invalid permissions', validateDogId, ERROR_CODES.PERMISSION.NO.DOG);
      }

      if (queriedDog.dogIsDeleted === 1) {
        // the dog has been found but its been deleted
        throw new HoundError('Dog has been deleted', validateDogId, ERROR_CODES.FAMILY.DELETED.DOG);
      }

      // dogId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedDogIds.push(queriedDog.dogId);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

/**
            * Checks to see that logId is defined, a number. and exists in the database under dogId provided. Log can be deleted.
            * If it does then the dog owns that log and invokes next().
            */
async function validateLogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
  // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateLogId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogIds === undefined || validatedDogIds === null) {
      throw new HoundError('validatedDogIds missing', validateLogId, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logsDictionary = formatArray(req.body['logs'] ?? [req.body]) as (Dictionary[] | undefined);
    console.log('\n\nlogsDictionary', logsDictionary);
    console.log('req.body', req.body);
    console.log('req.params', req.params);
    console.log('req.url', req.url);

    if (logsDictionary === undefined || logsDictionary === null) {
      throw new HoundError('logsDictionary missing', validateLogId, ERROR_CODES.VALUE.INVALID);
    }

    const promises: Promise<DogLogsRow[]>[] = [];
    // query for all reminders provided
    logsDictionary.forEach((logDictionary) => {
      const logId = formatNumber(logDictionary['logId']) ?? formatNumber(req.params['logId']);

      if (logId === undefined || logId === null) {
        throw new HoundError('logId missing', validateLogId, ERROR_CODES.VALUE.INVALID);
      }

      // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
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
        // the reminderId does not exist and/or the dog does not have access to that reminderId
        // eslint-disable-next-line no-await-in-loop
        throw new HoundError('No log found or invalid permissions', validateLogId, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (req.houndDeclarationExtendedProperties.validatedVariables.validatedDogIds.findIndex((dogId) => dogId === queriedLog.dogId) === -1) {
        throw new HoundError('No log found or invalid permissions', validateLogId, ERROR_CODES.PERMISSION.NO.LOG);
      }

      if (queriedLog.logIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Log has been deleted', validateLogId, ERROR_CODES.FAMILY.DELETED.LOG);
      }

      // reminderId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedLogIds.push(queriedLog.logId);
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
    const { validatedDogIds } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateReminderId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogIds === undefined || validatedDogIds === null) {
      throw new HoundError('validatedDogIds missing', validateReminderId, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (Dictionary[] | undefined);
    console.log('\n\nremindersDictionary', remindersDictionary);
    console.log('req.body', req.body);
    console.log('req.params', req.params);
    console.log('req.url', req.url);

    if (remindersDictionary === undefined || remindersDictionary === null) {
      throw new HoundError('remindersDictionary missing', validateReminderId, ERROR_CODES.VALUE.INVALID);
    }

    const promises: Promise<DogRemindersRow[]>[] = [];
    // query for all reminders provided
    remindersDictionary.forEach((reminderDictionary) => {
      const reminderId = formatNumber(reminderDictionary['reminderId']);

      if (reminderId === undefined || reminderId === null) {
        throw new HoundError('reminderId missing', validateReminderId, ERROR_CODES.VALUE.INVALID);
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
        throw new HoundError('No reminders found or invalid permissions', validateReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
      }

      if (queriedReminder.reminderIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Reminder has been deleted', validateReminderId, ERROR_CODES.FAMILY.DELETED.REMINDER);
      }

      // reminderId has been validated. Save it to validatedVariables
      req.houndDeclarationExtendedProperties.validatedVariables.validatedReminderIds.push(queriedReminder.reminderId);
    });
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

export {
  validateAppVersion, validateUserIdentifier, validateUserId, validateFamilyId, validateDogId, validateLogId, validateReminderId,
};
