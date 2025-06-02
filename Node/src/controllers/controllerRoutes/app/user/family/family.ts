import express from 'express';

import { getAllFamilyInformationForFamilyId } from '../../../../get/getFamily.js';

import { createFamilyForUserId } from '../../../../create/createFamily.js';

import { updateFamilyForUserIdFamilyId } from '../../../../update/updateFamily.js';

import { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId } from '../../../../delete/deleteFamily.js';
import { ERROR_CODES, HoundError } from '../../../../../main/server/globalErrors.js';

import { formatBoolean, formatUnknownString } from '../../../../../main/format/formatObject.js';

async function getFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getFamily, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', getFamily, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    const { familyActiveSubscription } = req.houndProperties;
    if (familyActiveSubscription === undefined || familyActiveSubscription === null) {
      throw new HoundError('familyActiveSubscription missing', getFamily, ERROR_CODES.VALUE.MISSING);
    }

    const result = await getAllFamilyInformationForFamilyId(databaseConnection, validatedFamilyId, familyActiveSubscription);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', getFamily, ERROR_CODES.VALUE.MISSING);
    }

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createFamily, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', createFamily, ERROR_CODES.PERMISSION.NO.USER);
    }

    const result = await createFamilyForUserId(databaseConnection, validatedUserId);

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function updateFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateFamily, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', updateFamily, ERROR_CODES.PERMISSION.NO.USER);
    }

    const { validatedFamilyId } = req.houndProperties.validatedVars;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyCode = formatUnknownString(req.body['familyCode']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyIsLocked = formatBoolean(req.body['familyIsLocked']);

    await updateFamilyForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyCode, familyIsLocked);
    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function deleteFamily(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId, validatedFamilyId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteFamily, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteFamily, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteFamily, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const familyKickUserId = formatUnknownString(req.body['familyKickUserId']);
    const { familyActiveSubscription } = req.houndProperties;
    if (familyActiveSubscription === undefined || familyActiveSubscription === null) {
      throw new HoundError('familyActiveSubscription missing', deleteFamily, ERROR_CODES.VALUE.MISSING);
    }

    if (familyKickUserId !== undefined && familyKickUserId !== null) {
      await kickFamilyMemberForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyKickUserId);
    }
    else {
      await deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, validatedUserId, validatedFamilyId, familyActiveSubscription);
    }

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getFamily, createFamily, updateFamily, deleteFamily,
};
