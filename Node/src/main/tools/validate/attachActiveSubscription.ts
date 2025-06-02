import express from 'express';
import { ERROR_CODES, HoundError } from '../../server/globalErrors.js';
import { getActiveTransaction } from '../../../controllers/get/getTransactions.js';

/**
 * Checks the family's subscription
 * Uses getActiveTransaction to either get the family's paid subscription or the default free subscription
 * Attached the information to the req (under req.houndProperties.familyActiveSubscription.xxx)
 */
async function attachActiveSubscription(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', attachActiveSubscription, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', attachActiveSubscription, ERROR_CODES.PERMISSION.NO.USER);
    }

    const familyActiveSubscription = await getActiveTransaction(databaseConnection, validatedUserId);

    req.houndProperties.familyActiveSubscription = familyActiveSubscription;
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }

  return next();
}

export { attachActiveSubscription };
