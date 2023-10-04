import express from 'express';
const { areAllDefined } from '../../main/tools/validate/validateDefined';

const { getAllFamilyInformationForFamilyId } from '../getFor/getForFamily';

const { createFamilyForUserId } from '../createFor/createForFamily';

const { updateFamilyForUserIdFamilyId } from '../updateFor/updateForFamily';

const { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId } from '../deleteFor/deleteForFamily';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) familyId formatted correctly and request has sufficient permissions to use
*/
async function getFamily(req: express.Request, res: express.Response) {
  try {
    const { familyId } = req.params;
    const result = await getAllFamilyInformationForFamilyId(req.databaseConnection, familyId, req.familyActiveSubscription);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createFamily(req: express.Request, res: express.Response) {
  try {
    const { userId } = req.params;
    const result = await createFamilyForUserId(req.databaseConnection, userId);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function updateFamily(req: express.Request, res: express.Response) {
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

async function deleteFamily(req: express.Request, res: express.Response) {
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

export {
  getFamily, createFamily, updateFamily, deleteFamily,
};
