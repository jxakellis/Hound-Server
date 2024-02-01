import express from 'express';
import { ERROR_CODES, HoundError } from '../../server/globalErrors.js';
import { getFamilyMembersForFamilyId } from '../../../controllers/getFor/getForFamily.js';

/**
 * Checks the family's subscription to see if it's expired
 * If the request's method isn't GET, PATCH or DELETE and the subscription is expired, returns 400 status
 */
async function validateSubscription(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateSubscription, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', validateSubscription, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateSubscription, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    const numberOfFamilyMembers = req.houndDeclarationExtendedProperties.familyActiveSubscription?.numberOfFamilyMembers;

    if (numberOfFamilyMembers === undefined || numberOfFamilyMembers === null) {
      throw new HoundError('numberOfFamilyMembers missing', validateSubscription, ERROR_CODES.VALUE.MISSING);
    }

    // a subscription doesn't matter for GET, PATCH, or DELETE requests. We can allow retrieving/deleting of information even if expired
    // We only deny POST or PUT requests if a expired subscription, stopping new information from being added
    if (req.method === 'GET' || req.method === 'PATCH' || req.method === 'DELETE') {
      return next();
    }

    const familyMembers = await getFamilyMembersForFamilyId(databaseConnection, validatedFamilyId);

    if (familyMembers.length > numberOfFamilyMembers) {
      throw new HoundError(`Family member limit of ${numberOfFamilyMembers} exceeded`, validateSubscription, ERROR_CODES.FAMILY.LIMIT.FAMILY_MEMBER_EXCEEDED);
    }
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

export { validateSubscription };
