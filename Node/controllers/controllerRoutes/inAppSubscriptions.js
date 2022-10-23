const { getAllInAppSubscriptionsForFamilyId } = require('../getFor/getForInAppSubscriptions');
const { createInAppSubscriptionForUserIdFamilyIdRecieptId } = require('../createFor/createForInAppSubscriptions');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

async function getInAppSubscriptions(req, res) {
  try {
    const { familyId } = req.params;
    const result = await getAllInAppSubscriptionsForFamilyId(req.databaseConnection, familyId);

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function createInAppSubscriptions(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { appStoreReceiptURL } = req.body;
    const result = await createInAppSubscriptionForUserIdFamilyIdRecieptId(req.databaseConnection, userId, familyId, appStoreReceiptURL);

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

module.exports = {
  getInAppSubscriptions, createInAppSubscriptions,
};
