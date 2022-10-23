const { getAllFamilyInformationForFamilyId } = require('../getFor/getForFamily');
const { createFamilyForUserId } = require('../createFor/createForFamily');
const { updateFamilyForUserIdFamilyId } = require('../updateFor/updateForFamily');
const { deleteFamilyForUserIdFamilyId } = require('../deleteFor/deleteForFamily');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) familyId formatted correctly and request has sufficient permissions to use
*/
async function getFamily(req, res) {
  try {
    const { familyId } = req.params;
    const result = await getAllFamilyInformationForFamilyId(req.databaseConnection, familyId, req.familyActiveSubscription);

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function createFamily(req, res) {
  try {
    const { userId } = req.params;
    const result = await createFamilyForUserId(req.databaseConnection, userId);

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function updateFamily(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { familyCode, familyIsLocked } = req.body;
    await updateFamilyForUserIdFamilyId(req.databaseConnection, userId, familyId, familyCode, familyIsLocked);
    return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function deleteFamily(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { familyKickUserId } = req.body;
    await deleteFamilyForUserIdFamilyId(req.databaseConnection, userId, familyId, familyKickUserId, req.familyActiveSubscription);
    return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

module.exports = {
  getFamily, createFamily, updateFamily, deleteFamily,
};
