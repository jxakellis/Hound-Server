import express from 'express';
import { getAllTransactions, getActiveTransaction } from '../../../../get/getTransactions.js';

import { createTransactionForAppStoreReceiptURL } from '../../../../create/createTransactions.js';
import { ERROR_CODES, HoundError } from '../../../../../main/server/globalErrors.js';

import { formatUnknownString } from '../../../../../main/format/formatObject.js';

async function getTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getTransactions, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', getTransactions, ERROR_CODES.PERMISSION.NO.USER);
    }

    const result = await getAllTransactions(databaseConnection, authUserId);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', getTransactions, ERROR_CODES.VALUE.MISSING);
    }

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndProperties;
    const { authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createTransactions, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', createTransactions, ERROR_CODES.PERMISSION.NO.USER);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const appStoreReceiptURL = formatUnknownString(req.body['appStoreReceiptURL']);
    if (appStoreReceiptURL === undefined || appStoreReceiptURL === null) {
      throw new HoundError('appStoreReceiptURL missing', createTransactions, ERROR_CODES.VALUE.MISSING);
    }

    await createTransactionForAppStoreReceiptURL(databaseConnection, authUserId, appStoreReceiptURL);

    // After we have updated the stored transactions, we want to return the new active subscription to the user.
    const result = await getActiveTransaction(databaseConnection, authUserId);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', createTransactions, ERROR_CODES.VALUE.MISSING);
    }

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getTransactions, createTransactions,
};
