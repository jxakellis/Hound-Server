import express from 'express';
import { ERROR_CODES, HoundError } from '../../server/globalErrors.js';
import { getActiveTransaction } from '../../../controllers/getFor/getForTransactions.js';
import { getAllFamilyMembersForFamilyId } from '../../../controllers/getFor/getForFamily.js';

/**
 * Checks the family's subscription
 * Uses getActiveTransaction to either get the family's paid subscription or the default free subscription
 * Attached the information to the req (under req.houndDeclarationExtendedProperties.familyActiveSubscription.xxx)
 */
async function attachActiveSubscription(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', attachActiveSubscription, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', attachActiveSubscription, ERROR_CODES.PERMISSION.NO.USER);
    }

    const familyActiveSubscription = await getActiveTransaction(databaseConnection, validatedUserId);

    req.houndDeclarationExtendedProperties.familyActiveSubscription = familyActiveSubscription;
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

/**
 * Checks the family's subscription to see if it's expired
 * If the request's method isn't GET or DELETE and the subscription is expired, returns 400 status
 */
async function validateSubscription(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const numberOfFamilyMembers = req.houndDeclarationExtendedProperties.familyActiveSubscription?.numberOfFamilyMembers;
    const numberOfDogs = req.houndDeclarationExtendedProperties.familyActiveSubscription?.numberOfDogs;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', validateSubscription, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', validateSubscription, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', validateSubscription, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (numberOfFamilyMembers === undefined || numberOfFamilyMembers === null) {
      throw new HoundError('numberOfFamilyMembers missing', validateSubscription, ERROR_CODES.VALUE.MISSING);
    }
    if (numberOfDogs === undefined || numberOfDogs === null) {
      throw new HoundError('numberOfDogs missing', validateSubscription, ERROR_CODES.VALUE.MISSING);
    }

    // a subscription doesn't matter for GET or DELETE requests. We can allow retrieving/deleting of information even if expired
    // We only deny POST or PUT requests if a expired subscription, stopping new information from being added
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const familyMembers = await getAllFamilyMembersForFamilyId(databaseConnection, validatedFamilyId);

    if (familyMembers.length > numberOfFamilyMembers) {
      throw new HoundError(`Family member limit of ${numberOfFamilyMembers} exceeded`, validateSubscription, ERROR_CODES.FAMILY.LIMIT.FAMILY_MEMBER_EXCEEDED);
    }
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

export { attachActiveSubscription, validateSubscription };
