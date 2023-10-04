import express from 'express';
const { getAllTransactions, getActiveTransaction } from '../getFor/getForTransactions';

const { createTransactionForAppStoreReceiptURL } from '../createFor/createForTransactions';

async function getTransactions(req: express.Request, res: express.Response) {
  try {
    const { userId } = req.params;
    const result = await getAllTransactions(req.databaseConnection, userId);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createTransactions(req: express.Request, res: express.Response) {
  try {
    const { userId } = req.params;
    const { appStoreReceiptURL } = req.body;

    await createTransactionForAppStoreReceiptURL(req.databaseConnection, userId, appStoreReceiptURL);

    // After we have updated the stored transactions, we want to return the new active subscription to the user.
    const result = await getActiveTransaction(req.databaseConnection, userId);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

export {
  getTransactions, createTransactions,
};
