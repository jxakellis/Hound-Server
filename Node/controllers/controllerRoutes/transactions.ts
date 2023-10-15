import express from 'express';
import { getAllTransactions, getActiveTransaction } from '../getFor/getForTransactions';

import { createTransactionForAppStoreReceiptURL } from '../createFor/createForTransactions';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject';

async function getTransactions(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId } = req.extendedProperties.validatedVariables;
    const result = await getAllTransactions(req.extendedProperties.databaseConnection, userId);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createTransactions(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId } = req.extendedProperties.validatedVariables;
    const { appStoreReceiptURL } = req.body;

    await createTransactionForAppStoreReceiptURL(req.extendedProperties.databaseConnection, userId, appStoreReceiptURL);

    // After we have updated the stored transactions, we want to return the new active subscription to the user.
    const result = await getActiveTransaction(req.extendedProperties.databaseConnection, userId);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export {
  getTransactions, createTransactions,
};
