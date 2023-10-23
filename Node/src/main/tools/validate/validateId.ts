import express from 'express';
import { addAppVersionToLogRequest, addFamilyIdToLogRequest, addUserIdToLogRequest } from 'src/main/logging/logRequest.js';
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
    const appVersion = formatUnknownString(req.params['appVersion']);

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
    // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
    const userIdentifier = formatUnknownString(req.query['userIdentifier']);

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
    // later on use a token here to validate that they have permission to use the userId
    const userId = formatUnknownString(req.params['userId']);
    const { validatedUserIdentifier } = req.houndDeclarationExtendedProperties.validatedVariables;
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (userId === undefined || userId === null) {
      throw new HoundError('userId missing', validateUserId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserIdentifier === undefined || validatedUserIdentifier === null) {
      throw new HoundError('validatedUserIdentifier missing', validateUserId, ERROR_CODES.VALUE.INVALID);
    }
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateUserId, ERROR_CODES.VALUE.INVALID);
    }

    // we are verifying that a user is able to use the provided userId, and to do so they must know the corresponding secret (the userIdentifier)
    const result = await databaseQuery<PublicUsersRow[]>(
      databaseConnection,
      `SELECT ${publicUsersColumns}
        FROM users u
        WHERE userId = ? AND userIdentifier = ?
        LIMIT 1`,
      [userId, validatedUserIdentifier],
    );

    const user = result.safeIndex(0);

    if (user === undefined || user === null) {
      // userId does not exist in the table
      throw new HoundError('No user found or invalid permissions', validateUserId, ERROR_CODES.PERMISSION.NO.USER);
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
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const familyId = formatUnknownString(req.params['familyId']);
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', validateFamilyId, ERROR_CODES.VALUE.INVALID);
    }
    if (familyId === undefined || familyId === null) {
      throw new HoundError('familyId missing', validateFamilyId, ERROR_CODES.VALUE.INVALID);
    }
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateFamilyId, ERROR_CODES.VALUE.INVALID);
    }

    // queries the database to find familyIds associated with the userId
    const result = await databaseQuery<FamilyMembersRow[]>(
      databaseConnection,
      `SELECT ${familyMembersColumns}
              FROM familyMembers fm
              WHERE userId = ? AND familyId = ?
              LIMIT 1`,
      [validatedUserId, familyId],
    );

    const family = result.safeIndex(0);

    if (family === undefined || family === null) {
      // familyId does not exist in the table
      throw new HoundError('No family found or invalid permissions', validateFamilyId, ERROR_CODES.PERMISSION.NO.FAMILY);
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
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const dogId = formatNumber(req.params['dogId']);
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('validatedFamilyId missing', validateDogId, ERROR_CODES.VALUE.INVALID);
    }
    if (dogId === undefined || dogId === null) {
      throw new HoundError('dogId missing', validateDogId, ERROR_CODES.VALUE.INVALID);
    }
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateDogId, ERROR_CODES.VALUE.INVALID);
    }

    // finds what dogId (s) the user has linked to their familyId
    // JOIN families as dog must have a family attached to it
    const dogs = await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumns}
                FROM dogs d
                JOIN families f ON d.familyId = f.familyId
                WHERE d.familyId = ? AND d.dogId = ?
                LIMIT 1`,
      [validatedFamilyId, dogId],
    );

    const dog = dogs.safeIndex(0);

    if (dog === undefined || dog === null) {
      // the dogId does not exist and/or the user does not have access to that dogId
      throw new HoundError('No dog found or invalid permissions', validateDogId, ERROR_CODES.PERMISSION.NO.DOG);
    }

    if (dog.dogIsDeleted === 1) {
      // the dog has been found but its been deleted
      throw new HoundError('Dog has been deleted', validateDogId, ERROR_CODES.FAMILY.DELETED.DOG);
    }

    // the dogId exists and it is linked to the familyId, valid
    req.houndDeclarationExtendedProperties.validatedVariables.validatedDogId = dogId;
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
  const { validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
  const logId = formatNumber(req.params['logId']);
  const { databaseConnection } = req.houndDeclarationExtendedProperties;

  if (validatedDogId === undefined || validatedDogId === null) {
    throw new HoundError('validatedDogId missing', validateLogId, ERROR_CODES.VALUE.INVALID);
  }
  if (logId === undefined || logId === null) {
    throw new HoundError('logId missing', validateLogId, ERROR_CODES.VALUE.INVALID);
  }
  if (databaseConnection === undefined || databaseConnection === null) {
    throw new HoundError('databaseConnection missing', validateLogId, ERROR_CODES.VALUE.INVALID);
  }

  try {
    // finds what logId (s) the user has linked to their dogId
    // JOIN dogs d as log has to have dog still attached to it
    const logs = await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumns}
                  FROM dogLogs dl
                  JOIN dogs d ON dl.dogId = d.dogId
                  WHERE dl.dogId = ? AND dl.logId = ?
                  LIMIT 1`,
      [validatedDogId, logId],
    );

    const log = logs.safeIndex(0);
    // search query result to find if the logIds linked to the dogIds match the logId provided, match means the user owns that logId

    if (log === undefined || log === null) {
      // the logId does not exist and/or the dog does not have access to that logId
      throw new HoundError('No logs found or invalid permissions', validateLogId, ERROR_CODES.PERMISSION.NO.LOG);
    }

    if (log.logIsDeleted === 1) {
      // the log has been found but its been deleted
      throw new HoundError('Log has been deleted', validateLogId, ERROR_CODES.FAMILY.DELETED.LOG);
    }

    // the logId exists and it is linked to the dogId, valid
    req.houndDeclarationExtendedProperties.validatedVariables.validatedLogId = logId;
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

/**
              * Checks to see that reminderId is defined, a number, and exists in the database under the dogId provided. Reminder can be deleted
              * If it does then the dog owns that reminder and invokes next().
              */
async function validateParamsReminderId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const reminderId = formatNumber(req.params['reminderId']);
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', validateParamsReminderId, ERROR_CODES.VALUE.INVALID);
    }
    if (reminderId === undefined || reminderId === null) {
      throw new HoundError('reminderId missing', validateParamsReminderId, ERROR_CODES.VALUE.INVALID);
    }
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateParamsReminderId, ERROR_CODES.VALUE.INVALID);
    }

    // finds what reminderId (s) the user has linked to their dogId
    // JOIN dogs d as reminder must have dog attached to it
    const reminders = await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumns}
                    FROM dogReminders dr
                    JOIN dogs d ON dr.dogId = d.dogId
                    WHERE dr.dogId = ? AND dr.reminderId = ?
                    LIMIT 1`,
      [validatedDogId, reminderId],
    );

    const reminder = reminders.safeIndex(0);

    // search query result to find if the reminderIds linked to the dogIds match the reminderId provided, match means the user owns that reminderId

    if (reminder === undefined || reminder === null) {
      // the reminderId does not exist and/or the dog does not have access to that reminderId
      throw new HoundError('No reminders found or invalid permissions', validateParamsReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
    }

    if (reminder.reminderIsDeleted === 1) {
      // the reminder has been found but its been deleted
      throw new HoundError('Reminder has been deleted', validateParamsReminderId, ERROR_CODES.FAMILY.DELETED.REMINDER);
    }

    req.houndDeclarationExtendedProperties.validatedVariables.validatedReminderIds = (req.houndDeclarationExtendedProperties.validatedVariables.validatedReminderIds ?? []).concat(reminderId);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

async function validateBodyReminderId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const remindersDictionary = formatArray(req.body['reminders'] ?? [req.body]) as (Dictionary[] | undefined);
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateBodyReminderId, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', validateBodyReminderId, ERROR_CODES.VALUE.INVALID);
    }
    if (remindersDictionary === undefined || remindersDictionary === null) {
      throw new HoundError('remindersDictionary missing', validateBodyReminderId, ERROR_CODES.VALUE.INVALID);
    }

    const promises: Promise<DogRemindersRow[]>[] = [];
    // query for all reminders provided
    remindersDictionary.forEach((reminderDictionary) => {
      const reminderId = formatNumber(reminderDictionary['reminderId']);

      if (reminderId === undefined || reminderId === null) {
        throw new HoundError('reminderId missing', validateBodyReminderId, ERROR_CODES.VALUE.INVALID);
      }

      // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
      promises.push(databaseQuery<DogRemindersRow[]>(
        databaseConnection,
        `SELECT ${dogRemindersColumns}
                        FROM dogReminders dr
                        JOIN dogs d ON dr.dogId = d.dogId
                        WHERE dr.dogId = ? AND dr.reminderId = ?
                        LIMIT 1`,
        [validatedDogId, reminderId],
      ));
    });

    const queriedReminders = await Promise.all(promises);

    queriedReminders.forEach((queriedReminderResult) => {
      const queriedReminder = queriedReminderResult.safeIndex(0);

      if (queriedReminder === undefined || queriedReminder === null) {
        // the reminderId does not exist and/or the dog does not have access to that reminderId
        // eslint-disable-next-line no-await-in-loop
        throw new HoundError('No reminders found or invalid permissions', validateBodyReminderId, ERROR_CODES.PERMISSION.NO.REMINDER);
      }

      if (queriedReminder.reminderIsDeleted === 1) {
        // the reminder has been found but its been deleted
        throw new HoundError('Reminder has been deleted', validateBodyReminderId, ERROR_CODES.FAMILY.DELETED.REMINDER);
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
  validateAppVersion, validateUserIdentifier, validateUserId, validateFamilyId, validateDogId, validateLogId, validateParamsReminderId, validateBodyReminderId,
};
