import express from 'express';
import { ERROR_CODES, HoundError } from '../../server/globalErrors';
import { getActiveTransaction } from '../../../controllers/getFor/getForTransactions';
import { getAllFamilyMembersForFamilyId } from '../../../controllers/getFor/getForFamily';
import { formatUnknownString } from '../../format/formatObject';

/**
 * Checks the family's subscription
 * Uses getActiveTransaction to either get the family's paid subscription or the default free subscription
 * Attached the information to the req (under req.extendedProperties.familyActiveSubscription.xxx)
 */
async function attachActiveSubscription(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const userId = formatUnknownString(req.params['userId']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'attachActiveSubscription', ERROR_CODES.VALUE.MISSING);
    }
    if (userId === undefined) {
      throw new HoundError('userId missing', 'attachActiveSubscription', ERROR_CODES.VALUE.MISSING);
    }

    const familyActiveSubscription = await getActiveTransaction(databaseConnection, userId);

    req.extendedProperties.familyActiveSubscription = familyActiveSubscription;

    return next();
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

/**
 * Checks the family's subscription to see if it's expired
 * If the request's method isn't GET or DELETE and the subscription is expired, returns 400 status
 */
async function validateSubscription(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const userId = formatUnknownString(req.params['userId']);
    const familyId = formatUnknownString(req.params['familyId']);
    const numberOfFamilyMembers = req.extendedProperties.familyActiveSubscription?.numberOfFamilyMembers;
    const numberOfDogs = req.extendedProperties.familyActiveSubscription?.numberOfDogs;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'validateSubscription', ERROR_CODES.VALUE.MISSING);
    }
    if (userId === undefined) {
      throw new HoundError('userId missing', 'validateSubscription', ERROR_CODES.VALUE.MISSING);
    }
    if (familyId === undefined) {
      throw new HoundError('familyId missing', 'validateSubscription', ERROR_CODES.VALUE.MISSING);
    }
    if (numberOfFamilyMembers === undefined) {
      throw new HoundError('numberOfFamilyMembers missing', 'validateSubscription', ERROR_CODES.VALUE.MISSING);
    }
    if (numberOfDogs === undefined) {
      throw new HoundError('numberOfDogs missing', 'validateSubscription', ERROR_CODES.VALUE.MISSING);
    }

    // a subscription doesn't matter for GET or DELETE requests. We can allow retrieving/deleting of information even if expired
    // We only deny POST or PUT requests if a expired subscription, stopping new information from being added
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const familyMembers = await getAllFamilyMembersForFamilyId(databaseConnection, familyId);

    if (familyMembers.length > numberOfFamilyMembers) {
      throw new HoundError(`Family member limit of ${numberOfFamilyMembers} exceeded`, 'validateSubscription', ERROR_CODES.FAMILY.LIMIT.FAMILY_MEMBER_EXCEEDED);
    }

    return next();
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export { attachActiveSubscription, validateSubscription };
