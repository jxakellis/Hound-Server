const { areAllDefined } = require('../../main/tools/validate/validateDefined');

const { getAllFamilyInformationForFamilyId } = require('../getFor/getForFamily');

const { createFamilyForUserId } = require('../createFor/createForFamily');

const { updateFamilyForUserIdFamilyId } = require('../updateFor/updateForFamily');

const { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId } = require('../deleteFor/deleteForFamily');

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) familyId formatted correctly and request has sufficient permissions to use
*/
async function getFamily(req, res) {
  try {
    const { familyId } = req.params;
    const result = await getAllFamilyInformationForFamilyId(req.databaseConnection, familyId, req.familyActiveSubscription);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createFamily(req, res) {
  try {
    const { userId } = req.params;
    const result = await createFamilyForUserId(req.databaseConnection, userId);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function updateFamily(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { familyCode, familyIsLocked } = req.body;
    await updateFamilyForUserIdFamilyId(req.databaseConnection, userId, familyId, familyCode, familyIsLocked);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function deleteFamily(req, res) {
  try {
    const { userId, familyId } = req.params;
    const { familyKickUserId } = req.body;
    if (areAllDefined(familyKickUserId) === true) {
      await kickFamilyMemberForUserIdFamilyId(req.databaseConnection, userId, familyId, familyKickUserId);
    }
    else {
      await deleteFamilyLeaveFamilyForUserIdFamilyId(req.databaseConnection, userId, familyId, req.familyActiveSubscription);
    }
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

module.exports = {
  getFamily, createFamily, updateFamily, deleteFamily,
};
