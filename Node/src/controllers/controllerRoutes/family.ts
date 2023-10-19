import express from 'express';

import { getAllFamilyInformationForFamilyId } from '../getFor/getForFamily.js';

import { createFamilyForUserId } from '../createFor/createForFamily.js';

import { updateFamilyForUserIdFamilyId } from '../updateFor/updateForFamily.js';

import { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId } from '../deleteFor/deleteForFamily.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatBoolean, formatUnknownString } from '../../main/format/formatObject.js';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) familyId formatted correctly and request has sufficient permissions to use
*/
async function getFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection, familyActiveSubscription } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (familyActiveSubscription === undefined) {
      throw new HoundError('familyActiveSubscription missing', getFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', getFamily, ERROR_CODES.VALUE.INVALID);
    }

    const result = await getAllFamilyInformationForFamilyId(databaseConnection, validatedFamilyId, familyActiveSubscription);

    if (result === undefined) {
      throw new HoundError('result missing', getFamily, ERROR_CODES.VALUE.INVALID);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', createFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', createFamily, ERROR_CODES.VALUE.INVALID);
    }

    const result = await createFamilyForUserId(databaseConnection, validatedUserId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyCode = formatUnknownString(req.body['familyCode']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyIsLocked = formatBoolean(req.body['familyIsLocked']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', updateFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', updateFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', updateFamily, ERROR_CODES.VALUE.INVALID);
    }

    await updateFamilyForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyCode, familyIsLocked);
    return res.houndDeclarationExtendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection, familyActiveSubscription } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyKickUserId = formatUnknownString(req.body['familyKickUserId']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', deleteFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (familyActiveSubscription === undefined) {
      throw new HoundError('familyActiveSubscription missing', deleteFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', deleteFamily, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', deleteFamily, ERROR_CODES.VALUE.INVALID);
    }

    if (familyKickUserId !== undefined) {
      await kickFamilyMemberForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyKickUserId);
    }
    else {
      await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyActiveSubscription);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getFamily, createFamily, updateFamily, deleteFamily,
};
