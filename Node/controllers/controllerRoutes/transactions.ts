import express from 'express';
import { getAllTransactions, getActiveTransaction } from '../getFor/getForTransactions';

import { createTransactionForAppStoreReceiptURL } from '../createFor/createForTransactions';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatUnknownString } from '../../main/format/formatObject';

async function getTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'getTransactions', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', 'getTransactions', ERROR_CODES.VALUE.INVALID);
    }

    const result = await getAllTransactions(databaseConnection, validatedUserId);

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const appStoreReceiptURL = formatUnknownString(req.body['appStoreReceiptURL']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'createTransactions', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', 'createTransactions', ERROR_CODES.VALUE.INVALID);
    }
    if (appStoreReceiptURL === undefined) {
      throw new HoundError('appStoreReceiptURL missing', 'createTransactions', ERROR_CODES.VALUE.INVALID);
    }

    await createTransactionForAppStoreReceiptURL(databaseConnection, validatedUserId, appStoreReceiptURL);

    // After we have updated the stored transactions, we want to return the new active subscription to the user.
    const result = await getActiveTransaction(databaseConnection, validatedUserId);

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getTransactions, createTransactions,
};
