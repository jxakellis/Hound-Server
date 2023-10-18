import express from 'express';

import { getAllFamilyInformationForFamilyId } from '../getFor/getForFamily';

import { createFamilyForUserId } from '../createFor/createForFamily';

import { updateFamilyForUserIdFamilyId } from '../updateFor/updateForFamily';

import { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId } from '../deleteFor/deleteForFamily';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) familyId formatted correctly and request has sufficient permissions to use
*/
async function getFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection, familyActiveSubscription } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'getFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (familyActiveSubscription === undefined) {
      throw new HoundError('familyActiveSubscription missing', 'getFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', 'getFamily', ERROR_CODES.VALUE.INVALID);
    }

    const result = await getAllFamilyInformationForFamilyId(databaseConnection, validatedFamilyId, familyActiveSubscription);

    if (result === undefined) {
      throw new HoundError('result missing', 'getFamily', ERROR_CODES.VALUE.INVALID);
    }

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'createFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', 'createFamily', ERROR_CODES.VALUE.INVALID);
    }

    const result = await createFamilyForUserId(databaseConnection, validatedUserId);

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function updateFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId, validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyCode = formatUnknownString(req.body['familyCode']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyIsLocked = formatBoolean(req.body['familyIsLocked']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'updateFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', 'updateFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', 'updateFamily', ERROR_CODES.VALUE.INVALID);
    }

    await updateFamilyForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyCode, familyIsLocked);
    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function deleteFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection, familyActiveSubscription } = req.extendedProperties;
    const { validatedUserId, validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyKickUserId = formatUnknownString(req.body['familyKickUserId']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'deleteFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (familyActiveSubscription === undefined) {
      throw new HoundError('familyActiveSubscription missing', 'deleteFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', 'deleteFamily', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', 'deleteFamily', ERROR_CODES.VALUE.INVALID);
    }

    if (familyKickUserId !== undefined) {
      await kickFamilyMemberForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyKickUserId);
    }
    else {
      await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyActiveSubscription);
    }

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getFamily, createFamily, updateFamily, deleteFamily,
};
