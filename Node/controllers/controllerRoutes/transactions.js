const { getAllTransactions, getActiveTransaction } = require('../getFor/getForTransactions');

const { createTransactionForAppStoreReceiptURL } = require('../createFor/createForTransactions');

async function getTransactions(req, res) {
  try {
    const { userId } = req.params;
    const result = await getAllTransactions(req.databaseConnection, userId);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createTransactions(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { appStoreReceiptURL } = req.body;

    await createTransactionForAppStoreReceiptURL(req.databaseConnection, userId, familyId, appStoreReceiptURL);

    // After we have updated the stored transactions, we want to return the new active subscription to the user.
    const result = await getActiveTransaction(req.databaseConnection, userId);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

module.exports = {
  getTransactions, createTransactions,
};
