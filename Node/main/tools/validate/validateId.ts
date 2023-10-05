import express from 'express';
const { databaseQuery } from '../database/databaseQuery';
const {
  formatSHA256Hash, formatString, formatArray, formatNumber, formatBoolean,
} from ''../format/formatObject';
const { areAllDefined } from './validateDefined';
const { ValidationError } from '../general/errors';
const { hash } from '../format/hash';

const { updateUserForUserIdentifierHashedUserIdentifier } from '../../../controllers/updateFor/updateForUser';

/**
 * Checks to see that the appVersion of the requester is compatible
 */
async function validateAppVersion(req: express.Request, res: express.Response, next: NextFunction) {
  const appVersion = formatString(req.params.appVersion);

  if (areAllDefined(appVersion) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('appVersion missing', global.CONSTANT.ERROR.VALUE.MISSING));
  }
  // the user isn't on the previous or current app version
  if (global.CONSTANT.SERVER.COMPATIBLE_IOS_APP_VERSIONS.includes(appVersion) === false) {
    return res.sendResponseForStatusBodyError(
      400,
      null,
      new ValidationError(
        `App version of ${appVersion} is incompatible. Compatible version(s): ${global.CONSTANT.SERVER.COMPATIBLE_IOS_APP_VERSIONS}`,
        global.CONSTANT.ERROR.GENERAL.APP_VERSION_OUTDATED,
      ),
    );
  }

  return next();
}

/**
 * Checks to see that userId and userIdentifier are defined, are valid, and exist in the database.
 */
async function validateUserId(req: express.Request, res: express.Response, next: NextFunction) {
  // later on use a token here to validate that they have permission to use the userId

  const userId = formatSHA256Hash(req.params.userId);
  // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
  const userIdentifier = formatString(req.query.userIdentifier);

  if (areAllDefined(userIdentifier, userId) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('userId or userIdentifier missing', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // if userId is defined and it is a number then continue
  try {
    // we are verifying that a user is able to use the provided userId, and to do so they must know the corresponding secret (the userIdentifier)
    let [result] = await databaseQuery(
      req.databaseConnection,
      `SELECT 1
      FROM users u
      WHERE userId = ? AND userIdentifier = ?
      LIMIT 1`,
      [userId, userIdentifier],
    );

    const hashedUserIdentifier = hash(userIdentifier);
    if (areAllDefined(result) === false && areAllDefined(hashedUserIdentifier) === true) {
      // If we can't find a user for a userIdentifier, hash that userIdentifier and then try again.
      // This is because we switched from hashing the Apple provided userIdentifier to directly storing it.
      // If query is successful, change saved userIdentifier and return result

      [result] = await databaseQuery(
        req.databaseConnection,
        `SELECT 1
        FROM users u
        WHERE userId = ? AND userIdentifier = ?
        LIMIT 1`,
        [userId, hashedUserIdentifier],
      );

      if (areAllDefined(result) === true) {
        await updateUserForUserIdentifierHashedUserIdentifier(
          req.databaseConnection,
          userIdentifier,
          hashedUserIdentifier,
        );
      }
    }

    if (areAllDefined(result) === false) {
      // userId does not exist in the table
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('No user found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.USER));
    }

    return next();
  }
  catch (error) {
    // couldn't query database to find userId
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

/**
 * Checks to see that familyId is defined, is a number, and exists in the database
 */
async function validateFamilyId(req: express.Request, res: express.Response, next: NextFunction) {
  // userId should be validated already
  const { userId } = req.params;
  const familyId = formatSHA256Hash(req.params.familyId);

  if (areAllDefined(familyId) === false) {
    // familyId was not provided or is invalid format
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('familyId missing', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // if familyId is defined and it is a number then continue
  try {
    // queries the database to find familyIds associated with the userId
    const result = await databaseQuery(
      req.databaseConnection,
      `SELECT 1
      FROM familyMembers fm
      WHERE userId = ? AND familyId = ?
      LIMIT 1`,
      [userId, familyId],
    );

    if (result.length === 0) {
      // familyId does not exist in the table
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('No family found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.FAMILY));
    }

    // familyId exists in the table, therefore userId is  part of the family
    // reassign req.params so that the id there is guarrenteed to be an int and not a string
    req.params.familyId = familyId;
    return next();
  }
  catch (error) {
    // couldn't query database to find familyId
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

/**
 * Checks to see that dogId is defined, a number, and exists in the database under familyId provided. Dog can be deleted.
 * If it does then the user owns the dog and invokes next().
 */
async function validateDogId(req: express.Request, res: express.Response, next: NextFunction) {
  // familyId should be validated already

  const { familyId } = req.params;
  const dogId = formatNumber(req.params.dogId);

  if (areAllDefined(dogId) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('dogId missing', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // query database to find out if user has permission for that dogId
  try {
    // finds what dogId (s) the user has linked to their familyId
    // JOIN families as dog must have a family attached to it
    const [dog] = await databaseQuery(
      req.databaseConnection,
      `SELECT dogIsDeleted
      FROM dogs d
      JOIN families f ON d.familyId = f.familyId
      WHERE d.familyId = ? AND d.dogId = ?
      LIMIT 1`,
      [familyId, dogId],
    );

    // search query result to find if the dogIds linked to the familyId match the dogId provided, match means the user owns that dogId

    if (areAllDefined(dog) === false) {
      // the dogId does not exist and/or the user does not have access to that dogId
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('No dog found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.DOG));
    }

    if (formatBoolean(dog.dogIsDeleted) !== false) {
      // the dog has been found but its been deleted
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('Dog has been deleted', global.CONSTANT.ERROR.FAMILY.DELETED.DOG));
    }

    // the dogId exists and it is linked to the familyId, valid!
    // reassign req.params so that the id there is guarrenteed to be an int and not a string
    req.params.dogId = dogId;
    return next();
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

/**
 * Checks to see that logId is defined, a number. and exists in the database under dogId provided. Log can be deleted.
 * If it does then the dog owns that log and invokes next().
 */
async function validateLogId(req: express.Request, res: express.Response, next: NextFunction) {
  // dogId should be validated already

  const { dogId } = req.params;
  const logId = formatNumber(req.params.logId);

  if (areAllDefined(logId) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('logId missing', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // query database to find out if user has permission for that logId
  try {
    // finds what logId (s) the user has linked to their dogId
    // JOIN dogs d as log has to have dog still attached to it
    const [log] = await databaseQuery(
      req.databaseConnection,
      `SELECT logIsDeleted
      FROM dogLogs dl
      JOIN dogs d ON dl.dogId = d.dogId
      WHERE dl.dogId = ? AND dl.logId = ?
      LIMIT 1`,
      [dogId, logId],
    );

    // search query result to find if the logIds linked to the dogIds match the logId provided, match means the user owns that logId

    if (areAllDefined(log) === false) {
      // the logId does not exist and/or the dog does not have access to that logId
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('No logs found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.LOG));
    }

    if (formatBoolean(log.logIsDeleted) !== false) {
      // the log has been found but its been deleted
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('Log has been deleted', global.CONSTANT.ERROR.FAMILY.DELETED.LOG));
    }

    // the logId exists and it is linked to the dogId, valid!
    // reassign req.params so that the id there is guarrenteed to be an int and not a string
    req.params.logId = logId;
    return next();
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

/**
 * Checks to see that reminderId is defined, a number, and exists in the database under the dogId provided. Reminder can be deleted
 * If it does then the dog owns that reminder and invokes next().
 */
async function validateParamsReminderId(req: express.Request, res: express.Response, next: NextFunction) {
  // dogId should be validated already

  const { dogId } = req.params;
  const reminderId = formatNumber(req.params.reminderId);

  if (areAllDefined(reminderId) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('reminderId missing', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  // query database to find out if user has permission for that reminderId
  try {
    // finds what reminderId (s) the user has linked to their dogId
    // JOIN dogs d as reminder must have dog attached to it
    const [reminder] = await databaseQuery(
      req.databaseConnection,
      `SELECT reminderIsDeleted
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE dr.dogId = ? AND dr.reminderId = ?
      LIMIT 1`,
      [dogId, reminderId],
    );

    // search query result to find if the reminderIds linked to the dogIds match the reminderId provided, match means the user owns that reminderId

    if (areAllDefined(reminder) === false) {
      // the reminderId does not exist and/or the dog does not have access to that reminderId
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('No reminders found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.REMINDER));
    }

    if (formatBoolean(reminder.reminderIsDeleted) !== false) {
      // the reminder has been found but its been deleted
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('Reminder has been deleted', global.CONSTANT.ERROR.FAMILY.DELETED.REMINDER));
    }

    // the reminderId exists and it is linked to the dogId, valid!
    // reassign req.params so that the id there is guarrenteed to be an int and not a string
    req.params.reminderId = reminderId;
    return next();
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function validateBodyReminderId(req: express.Request, res: express.Response, next: NextFunction) {
  // dogId should be validated already

  const { dogId } = req.params;
  // to simplify process, whether user provides one reminder or an array of reminders, we just throw in the same array
  const reminders = areAllDefined(formatArray(req.body.reminders)) === true ? formatArray(req.body.reminders) : [req.body];

  if (areAllDefined(reminders) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('reminders missing', global.CONSTANT.ERROR.VALUE.INVALID));
  }

  let promises = [];
  // query for all reminders provided
  for (let i = 0; i < reminders.length; i += 1) {
    const reminderId = formatNumber(reminders[i].reminderId);

    if (areAllDefined(reminderId) === false) {
      return res.sendResponseForStatusBodyError(400, null, new ValidationError('reminderId missing', global.CONSTANT.ERROR.VALUE.INVALID));
    }

    // Attempt to locate a reminder. It must match the reminderId provided while being attached to a dog that the user has permission to use
    promises.push(databaseQuery(
      req.databaseConnection,
      `SELECT reminderIsDeleted
      FROM dogReminders dr
      JOIN dogs d ON dr.dogId = d.dogId
      WHERE dr.dogId = ? AND dr.reminderId = ?
      LIMIT 1`,
      [dogId, reminderId],
    ));
  }

  // perform promise on all reminders
  try {
    promises = await Promise.all(promises);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }

  // parse all reminders
  for (let i = 0; i < promises.length; i += 1) {
    const [reminder] = promises[i];

    if (areAllDefined(reminder) === false) {
      // the reminderId does not exist and/or the dog does not have access to that reminderId
      // eslint-disable-next-line no-await-in-loop
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('No reminders found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.REMINDER));
    }

    if (formatBoolean(reminder.reminderIsDeleted) !== false) {
      // the reminder has been found but its been deleted
      return res.sendResponseForStatusBodyError(404, null, new ValidationError('Reminder has been deleted', global.CONSTANT.ERROR.FAMILY.DELETED.REMINDER));
    }
    // The reminderId exists and it is linked to the dogId! Reassign reminderId to guarantee integer and not a string
    reminders[i].reminderId = formatNumber(reminders[i].reminderId);
  }

  // if this request happens to be for a single reminder instead of an array,
  // reassign req.body so that the id there is guarrenteed to be an int and not a string
  req.body.reminderId = formatNumber(req.body.reminderId);

  // successfully checked all reminderIds
  return next();
}

export {
  validateAppVersion, validateUserId, validateFamilyId, validateDogId, validateLogId, validateParamsReminderId, validateBodyReminderId,
};