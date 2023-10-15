import express from 'express';
import { databaseQuery } from '../../database/databaseQuery';
import {
  formatUnknownString, formatNumber, formatBoolean, formatArray,
} from '../../format/formatObject';
import { HoundError, ERROR_CODES } from '../../server/globalErrors';
import { hash } from '../../format/hash';

import { updateUserForUserIdentifierHashedUserIdentifier } from '../../../controllers/updateFor/updateForUser';
import { SERVER } from '../../server/globalConstants';
import { PublicUsersRow, publicUsersColumnsWithUPrefix } from '../../types/UsersRow';
import { FamilyMembersRow, familyMembersColumnsWithFMPrefix } from '../../types/FamilyMembersRow';
import { DogsRow, dogsColumnsWithDPrefix } from '../../types/DogsRow';
import { DogLogsRow, dogLogsColumnsWithDLPrefix } from '../../types/DogLogsRow';
import { DogRemindersRow, dogRemindersColumnsWithDRPrefix } from '../../types/DogRemindersRow';

// TODO NOW for all next() paths, all req.extendedProperties.validatedVariables.foo = foo. this will track the ids that we have verified.
// TODO NOW there should only ever be ONE (1) req.params.someId access for any given id (e.g. userId). This access should be inside a function to validate the id's value, then all other accesses should be from validatedVariables

/**
 * Checks to see that the appVersion of the requester is compatible
 */
async function validateAppVersion(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const appVersion = formatUnknownString(req.params['appVersion']);

  if (appVersion === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('appVersion missing', 'validateAppVersion', ERROR_CODES.VALUE.MISSING));
  }
  // the user isn't on the previous or current app version
  if (SERVER.COMPATIBLE_IOS_APP_VERSIONS.includes(appVersion) === false) {
    return res.extendedProperties.sendResponseForStatusBodyError(
      400,
      undefined,
      new HoundError(
        `App version of ${appVersion} is incompatible. Compatible version(s): ${SERVER.COMPATIBLE_IOS_APP_VERSIONS}`,
        'validateAppVersion',
        ERROR_CODES.GENERAL.APP_VERSION_OUTDATED,
      ),
    );
  }

  return next();
}

/**
 * Checks to see that userId and userIdentifier are defined, are valid, and exist in the database.
 */
async function validateUserId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  // TODO NOW add validateUserIdentifier function. check to see if the userIdentifier or a hashed version of it exist in the database. if exists, then attach to validatedVariables

  // later on use a token here to validate that they have permission to use the userId
  const userId = formatUnknownString(req.params['userId']);
  // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
  const userIdentifier = formatUnknownString(req.query['userIdentifier']);
  const { databaseConnection } = req.extendedProperties;

  if (userId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('userId missing', 'validateUserId', ERROR_CODES.VALUE.INVALID));
  }
  if (userIdentifier === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('userIdentifier missing', 'validateUserId', ERROR_CODES.VALUE.INVALID));
  }
  if (databaseConnection === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', 'validateUserId', ERROR_CODES.VALUE.INVALID));
  }

  // if userId is defined and it is a number then continue
  try {
    // we are verifying that a user is able to use the provided userId, and to do so they must know the corresponding secret (the userIdentifier)
    const regularResult = await databaseQuery<PublicUsersRow[]>(
      databaseConnection,
      `SELECT ${publicUsersColumnsWithUPrefix}
      FROM users u
      WHERE userId = ? AND userIdentifier = ?
      LIMIT 1`,
      [userId, userIdentifier],
    );

    let user = regularResult.safeIndex(0);

    if (user === undefined) {
      const hashedUserIdentifier = hash(userIdentifier);
      // If we can't find a user for a userIdentifier, hash that userIdentifier and then try again.
      // This is because we switched from hashing the Apple provided userIdentifier to directly storing it.
      // If query is successful, change saved userIdentifier and return result

      const hashedResult = await databaseQuery<PublicUsersRow[]>(
        databaseConnection,
        `SELECT ${publicUsersColumnsWithUPrefix}
        FROM users u
        WHERE userId = ? AND userIdentifier = ?
        LIMIT 1`,
        [userId, hashedUserIdentifier],
      );

      user = hashedResult.safeIndex(0);

      if (user !== undefined) {
        await updateUserForUserIdentifierHashedUserIdentifier(
          databaseConnection,
          userIdentifier,
          hashedUserIdentifier,
        );
      }
    }

    if (user === undefined) {
      // userId does not exist in the table
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('No user found or invalid permissions', 'validateUserId', ERROR_CODES.PERMISSION.NO.USER));
    }

    req.extendedProperties.validatedVariables.validatedUserId = userId;

    return next();
  }
  catch (error) {
    // couldn't query database to find userId
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

/**
 * Checks to see that familyId is defined, is a number, and exists in the database
 */
async function validateFamilyId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  // userId should be validated already
  const { validatedUserId } = req.extendedProperties.validatedVariables;
  const familyId = formatUnknownString(req.params['familyId']);
  const { databaseConnection } = req.extendedProperties;

  if (validatedUserId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedUserId missing', 'validateFamilyId', ERROR_CODES.VALUE.INVALID));
  }
  if (familyId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('familyId missing', 'validateFamilyId', ERROR_CODES.VALUE.INVALID));
  }
  if (databaseConnection === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', 'validateFamilyId', ERROR_CODES.VALUE.INVALID));
  }

  // if familyId is defined and it is a number then continue
  try {
    // queries the database to find familyIds associated with the userId
    const result = await databaseQuery<FamilyMembersRow[]>(
      databaseConnection,
      `SELECT ${familyMembersColumnsWithFMPrefix}
      FROM familyMembers fm
      WHERE userId = ? AND familyId = ?
      LIMIT 1`,
      [validatedUserId, familyId],
    );

    const family = result.safeIndex(0);

    if (family === undefined) {
      // familyId does not exist in the table
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('No family found or invalid permissions', 'validateFamilyId', ERROR_CODES.PERMISSION.NO.FAMILY));
    }

    req.extendedProperties.validatedVariables.validatedFamilyId = familyId;

    return next();
  }
  catch (error) {
    // couldn't query database to find familyId
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

/**
 * Checks to see that dogId is defined, a number, and exists in the database under familyId provided. Dog can be deleted.
 * If it does then the user owns the dog and invokes next().
 */
async function validateDogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const { validatedFamilyId } = req.extendedProperties.validatedVariables;
  const dogId = formatNumber(req.params['dogId']);
  const { databaseConnection } = req.extendedProperties;

  if (validatedFamilyId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', 'validateDogId', ERROR_CODES.VALUE.INVALID));
  }
  if (dogId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('dogId missing', 'validateDogId', ERROR_CODES.VALUE.INVALID));
  }
  if (databaseConnection === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', 'validateDogId', ERROR_CODES.VALUE.INVALID));
  }

  try {
    // finds what dogId (s) the user has linked to their familyId
    // JOIN families as dog must have a family attached to it
    const dogs = await databaseQuery<DogsRow[]>(
      databaseConnection,
      `SELECT ${dogsColumnsWithDPrefix}
      FROM dogs d
      JOIN families f ON d.familyId = f.familyId
      WHERE d.familyId = ? AND d.dogId = ?
      LIMIT 1`,
      [validatedFamilyId, dogId],
    );

    const dog = dogs.safeIndex(0);

    if (dog === undefined) {
      // the dogId does not exist and/or the user does not have access to that dogId
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('No dog found or invalid permissions', 'validateDogId', ERROR_CODES.PERMISSION.NO.DOG));
    }

    if (dog.dogIsDeleted === 1) {
      // the dog has been found but its been deleted
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('Dog has been deleted', 'validateDogId', ERROR_CODES.FAMILY.DELETED.DOG));
    }

    // the dogId exists and it is linked to the familyId, valid!
    // reassign req.params so that the id there is guarrenteed to be an int and not a string
    req.extendedProperties.validatedVariables.validatedDogId = dogId;

    return next();
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

/**
 * Checks to see that logId is defined, a number. and exists in the database under dogId provided. Log can be deleted.
 * If it does then the dog owns that log and invokes next().
 */
async function validateLogId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const { validatedDogId } = req.extendedProperties.validatedVariables;
  const logId = formatNumber(req.params['logId']);
  const { databaseConnection } = req.extendedProperties;

  if (validatedDogId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedDogId missing', 'validateLogId', ERROR_CODES.VALUE.INVALID));
  }
  if (logId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('logId missing', 'validateLogId', ERROR_CODES.VALUE.INVALID));
  }
  if (databaseConnection === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', 'validateLogId', ERROR_CODES.VALUE.INVALID));
  }

  try {
    // finds what logId (s) the user has linked to their dogId
    // JOIN dogs d as log has to have dog still attached to it
    const logs = await databaseQuery<DogLogsRow[]>(
      databaseConnection,
      `SELECT ${dogLogsColumnsWithDLPrefix}
      FROM dogLogs dl
      JOIN dogs d ON dl.dogId = d.dogId
      WHERE dl.dogId = ? AND dl.logId = ?
      LIMIT 1`,
      [validatedDogId, logId],
    );

    const log = logs.safeIndex(0);
    // search query result to find if the logIds linked to the dogIds match the logId provided, match means the user owns that logId

    if (log === undefined) {
      // the logId does not exist and/or the dog does not have access to that logId
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('No logs found or invalid permissions', 'validateLogId', ERROR_CODES.PERMISSION.NO.LOG));
    }

    if (log.logIsDeleted === 1) {
      // the log has been found but its been deleted
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('Log has been deleted', 'validateLogId', ERROR_CODES.FAMILY.DELETED.LOG));
    }

    // the logId exists and it is linked to the dogId, valid!
    // reassign req.params so that the id there is guarrenteed to be an int and not a string
    req.extendedProperties.validatedVariables.validatedLogId = logId;

    return next();
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

/**
 * Checks to see that reminderId is defined, a number, and exists in the database under the dogId provided. Reminder can be deleted
 * If it does then the dog owns that reminder and invokes next().
 */
async function validateParamsReminderId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const { validatedDogId } = req.extendedProperties.validatedVariables;
  const reminderId = formatNumber(req.params['reminderId']);
  const { databaseConnection } = req.extendedProperties;

  if (validatedDogId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedDogId missing', 'validateParamsReminderId', ERROR_CODES.VALUE.INVALID));
  }
  if (reminderId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('reminderId missing', 'validateParamsReminderId', ERROR_CODES.VALUE.INVALID));
  }
  if (databaseConnection === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', 'validateParamsReminderId', ERROR_CODES.VALUE.INVALID));
  }

  try {
    // finds what reminderId (s) the user has linked to their dogId
    // JOIN dogs d as reminder must have dog attached to it
    const reminders = await databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumnsWithDRPrefix}
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE dr.dogId = ? AND dr.reminderId = ?
      LIMIT 1`,
      [validatedDogId, reminderId],
    );

    const reminder = reminders.safeIndex(0);

    // search query result to find if the reminderIds linked to the dogIds match the reminderId provided, match means the user owns that reminderId

    if (reminder === undefined) {
      // the reminderId does not exist and/or the dog does not have access to that reminderId
      return res.extendedProperties.sendResponseForStatusBodyError(
        404,
        undefined,
        new HoundError('No reminders found or invalid permissions', 'validateParamsReminderId', ERROR_CODES.PERMISSION.NO.REMINDER),
      );
    }

    if (formatBoolean(reminder.reminderIsDeleted) !== false) {
      // the reminder has been found but its been deleted
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('Reminder has been deleted', 'validateParamsReminderId', ERROR_CODES.FAMILY.DELETED.REMINDER));
    }

    req.extendedProperties.validatedVariables.validatedReminderId = reminderId;
    return next();
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function validateBodyReminderId(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const { validatedDogId } = req.extendedProperties.validatedVariables;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const castedReminders = formatArray(req.body['reminders'] ?? [req.body]) as Partial<DogRemindersRow>[];
  const { databaseConnection } = req.extendedProperties;

  if (validatedDogId === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedDogId missing', 'validateBodyReminderId', ERROR_CODES.VALUE.INVALID));
  }
  if (castedReminders === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('reminders missing', 'validateBodyReminderId', ERROR_CODES.VALUE.INVALID));
  }
  if (databaseConnection === undefined) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', 'validateBodyReminderId', ERROR_CODES.VALUE.INVALID));
  }

  let promises = [];
  // query for all reminders provided
  for (let i = 0; i < castedReminders.length; i += 1) {
    const reminderId = formatNumber(castedReminders[i].reminderId);

    if (reminderId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('reminderId missing', 'validateBodyReminderId', ERROR_CODES.VALUE.INVALID));
    }

    // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
    promises.push(databaseQuery<DogRemindersRow[]>(
      databaseConnection,
      `SELECT ${dogRemindersColumnsWithDRPrefix}
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE dr.dogId = ? AND dr.reminderId = ?
      LIMIT 1`,
      [validatedDogId, reminderId],
    ));
  }

  // perform promise on all reminders
  try {
    promises = await Promise.all(promises);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }

  // parse all reminders
  for (let i = 0; i < promises.length; i += 1) {
    const [queriedReminder] = promises[i];

    if (queriedReminder === undefined) {
      // the reminderId does not exist and/or the dog does not have access to that reminderId
      // eslint-disable-next-line no-await-in-loop
      return res.extendedProperties.sendResponseForStatusBodyError(
        404,
        undefined,
        new HoundError('No reminders found or invalid permissions', 'validateBodyReminderId', ERROR_CODES.PERMISSION.NO.REMINDER),
      );
    }

    if (queriedReminder.reminderIsDeleted === 1) {
      // the reminder has been found but its been deleted
      return res.extendedProperties.sendResponseForStatusBodyError(404, undefined, new HoundError('Reminder has been deleted', 'validateBodyReminderId', ERROR_CODES.FAMILY.DELETED.REMINDER));
    }

    // reminderId has been validated. Save it to validatedVariables
    req.extendedProperties.validatedVariables.validatedReminderIds.push(queriedReminder.reminderId);
  }

  // this request might happen to be for a single reminder instead of an array
  // reminderId has been validated. Save it to validatedVariables
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  req.extendedProperties.validatedVariables.validatedReminderId = formatNumber(req.body['reminderId']);

  return next();
}

export {
  validateAppVersion, validateUserId, validateFamilyId, validateDogId, validateLogId, validateParamsReminderId, validateBodyReminderId,
};
