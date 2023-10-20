import express from 'express';

import { getDogForDogId, getAllDogsForUserIdFamilyId } from '../getFor/getForDogs.js';

import { createDogForFamilyId } from '../createFor/createForDogs.js';

import { updateDogForDogId } from '../updateFor/updateForDogs.js';

import { deleteDogForFamilyIdDogId } from '../deleteFor/deleteForDogs.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject.js';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) dogId formatted correctly and request has sufficient permissions to use
*/
async function getDogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId, validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);
    const isRetrievingReminders = formatBoolean(req.query['isRetrievingReminders']) ?? false;
    const isRetrievingLogs = formatBoolean(req.query['isRetrievingLogs']) ?? false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const signedPayload = formatUnknownString(req.body['signedPayload']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getDogs, ERROR_CODES.VALUE.INVALID);
    }
    if (signedPayload === undefined) {
      throw new HoundError('signedPayload missing', getDogs, ERROR_CODES.VALUE.INVALID);
    }

    if (validatedDogId !== undefined) {
      const result = await getDogForDogId(databaseConnection, validatedDogId, isRetrievingReminders, isRetrievingLogs, previousDogManagerSynchronization);

      if (result === undefined) {
        throw new HoundError('getDogForDogId result undefined', getDogs, ERROR_CODES.VALUE.INVALID);
      }
      return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
    }

    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', getDogs, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', getDogs, ERROR_CODES.VALUE.INVALID);
    }

    const result = await getAllDogsForUserIdFamilyId(
      databaseConnection,
      validatedUserId,
      validatedFamilyId,
      isRetrievingReminders,
      isRetrievingLogs,
      previousDogManagerSynchronization,
    );

    if (result === undefined) {
      throw new HoundError('getAllDogsForUserIdFamilyId result undefined', getDogs, ERROR_CODES.VALUE.INVALID);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', createDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', createDog, ERROR_CODES.VALUE.INVALID);
    }
    if (dogName === undefined) {
      throw new HoundError('dogName missing', createDog, ERROR_CODES.VALUE.INVALID);
    }

    const result = await createDogForFamilyId(databaseConnection, validatedFamilyId, dogName);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', updateDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', updateDog, ERROR_CODES.VALUE.INVALID);
    }
    if (dogName === undefined) {
      throw new HoundError('dogName missing', updateDog, ERROR_CODES.VALUE.INVALID);
    }

    await updateDogForDogId(databaseConnection, validatedDogId, dogName);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', deleteDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', deleteDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', deleteDog, ERROR_CODES.VALUE.INVALID);
    }

    await deleteDogForFamilyIdDogId(databaseConnection, validatedFamilyId, validatedDogId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
