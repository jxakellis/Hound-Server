import express from 'express';
import { getAllTransactions, getActiveTransaction } from '../getFor/getForTransactions.js';

import { createTransactionForAppStoreReceiptURL } from '../createFor/createForTransactions.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatUnknownString } from '../../main/format/formatObject.js';

async function getTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getTransactions, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', getTransactions, ERROR_CODES.VALUE.INVALID);
    }

    const result = await getAllTransactions(databaseConnection, validatedUserId);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', getTransactions, ERROR_CODES.VALUE.INVALID);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const appStoreReceiptURL = formatUnknownString(req.body['appStoreReceiptURL']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createTransactions, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', createTransactions, ERROR_CODES.VALUE.INVALID);
    }
    if (appStoreReceiptURL === undefined || appStoreReceiptURL === null) {
      throw new HoundError('appStoreReceiptURL missing', createTransactions, ERROR_CODES.VALUE.INVALID);
    }

    await createTransactionForAppStoreReceiptURL(databaseConnection, validatedUserId, appStoreReceiptURL);

    // After we have updated the stored transactions, we want to return the new active subscription to the user.
    const result = await getActiveTransaction(databaseConnection, validatedUserId);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', createTransactions, ERROR_CODES.VALUE.INVALID);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getTransactions, createTransactions,
};
