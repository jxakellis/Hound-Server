const { getAllInAppSubscriptionsForFamilyId, getActiveInAppSubscriptionForFamilyId } = require('../getFor/getForTransactions');

const { createTransactionsForAppStoreReceiptURL } = require('../../main/tools/appStoreConnectAPI/insertTransaction');

async function getInAppSubscriptions(req, res) {
  try {
    const { familyId } = req.params;
    const result = await getAllInAppSubscriptionsForFamilyId(req.databaseConnection, familyId);

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createInAppSubscriptions(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { appStoreReceiptURL } = req.body;
    // TODO NOW extract transactionId from appStoreReceiptURL then use api to query apple's servers
    /*
    const receiptUtil = new ReceiptUtility()
const transactionId = receiptUtil.extractTransactionIdFromAppReceipt(appReceipt)
*/
    const result = await createTransactionsForAppStoreReceiptURL(req.databaseConnection, userId, familyId, appStoreReceiptURL);

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

module.exports = {
  getInAppSubscriptions, createInAppSubscriptions,
};
