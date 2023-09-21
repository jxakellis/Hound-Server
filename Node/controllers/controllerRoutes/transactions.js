const { getAllTransactions, getActiveTransaction } = require('../getFor/getForTransactions');

const { g } = require('../../main/tools/appStoreConnectAPI/queryTransactions');

async function getTransactions(req, res) {
  try {
    const { familyId } = req.params;
    const result = await getAllTransactions(req.databaseConnection, familyId);

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

    // TODO NOW invoke create transactions from ASR url then return the active subscription
    const result = await createTransactionsForAppStoreReceiptURL(req.databaseConnection, userId, familyId, appStoreReceiptURL);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

module.exports = {
  getTransactions, createTransactions,
};
