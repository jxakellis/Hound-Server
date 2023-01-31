const { getAllInAppSubscriptionsForFamilyId } = require('../getFor/getForInAppSubscriptions');

const { createInAppSubscriptionForUserIdFamilyIdRecieptId } = require('../createFor/createForInAppSubscriptions');

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
    const result = await createInAppSubscriptionForUserIdFamilyIdRecieptId(req.databaseConnection, userId, familyId, appStoreReceiptURL);

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

module.exports = {
  getInAppSubscriptions, createInAppSubscriptions,
};
