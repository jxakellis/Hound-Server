import express from 'express';

import { getAllFamilyInformationForFamilyId } from '../getFor/getForFamily';

import { createFamilyForUserId } from '../createFor/createForFamily';

import { updateFamilyForUserIdFamilyId } from '../updateFor/updateForFamily';

import { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId } from '../deleteFor/deleteForFamily';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- userId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) familyId formatted correctly and request has sufficient permissions to use
*/
async function getFamily(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    const { familyActiveSubscription } = req.extendedProperties;
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (familyActiveSubscription === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('familyActiveSubscription missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const result = await getAllFamilyInformationForFamilyId(databaseConnection, validatedFamilyId, familyActiveSubscription);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createFamily(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedUserId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedUserId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const result = await createFamilyForUserId(databaseConnection, validatedUserId);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function updateFamily(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId, validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId, familyId } = req.extendedProperties.validatedVariables;
    const { familyCode, familyIsLocked } = req.body;
    await updateFamilyForUserIdFamilyId(req.extendedProperties.databaseConnection, userId, familyId, familyCode, familyIsLocked);
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function deleteFamily(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId, familyId } = req.extendedProperties.validatedVariables;
    const { familyKickUserId } = req.body;
    if (areAllDefined(familyKickUserId) === true) {
      await kickFamilyMemberForUserIdFamilyId(req.extendedProperties.databaseConnection, userId, familyId, familyKickUserId);
    }
    else {
      await deleteFamilyLeaveFamilyForUserIdFamilyId(req.extendedProperties.databaseConnection, userId, familyId, req.extendedProperties.familyActiveSubscription);
    }
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export {
  getFamily, createFamily, updateFamily, deleteFamily,
};
