import express from 'express';
import { addFamilyIdToLogRequest, addUserIdToLogRequest } from '../../logging/logRequest.js';
import { databaseQuery } from '../../database/databaseQuery.js';
import {
  formatUnknownString, formatNumber,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';
import { hash } from '../../format/hash.js';

import { updateUserForUserIdentifierHashedUserIdentifier } from '../../../controllers/updateFor/updateForUser.js';
import { type PublicUsersRow, publicUsersColumns } from '../../types/UsersRow.js';
import { type FamilyMembersRow, familyMembersColumns } from '../../types/FamilyMembersRow.js';

async function validateUserIdentifier(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    // TODO FUTURE depreciate req.query userIdentifier, last used <= 3.0.0
    // unhashedUserIdentifier: unhashed, 44-length apple identifier or 64-length sha-256 hash of apple identifier
    /* cspell: disable-next-line */
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

export {
  validateUserIdentifier,
  validateUserId,
  validateFamilyId,
};
