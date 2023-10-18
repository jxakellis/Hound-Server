import express from 'express';

import { getDogForDogId, getAllDogsForUserIdFamilyId } from '../getFor/getForDogs';

import { createDogForFamilyId } from '../createFor/createForDogs';

import { updateDogForDogId } from '../updateFor/updateForDogs';

import { deleteDogForFamilyIdDogId } from '../deleteFor/deleteForDogs';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) dogId formatted correctly and request has sufficient permissions to use
*/
async function getDogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId, validatedFamilyId, validatedDogId } = req.extendedProperties.validatedVariables;
    const userConfigurationPreviousDogManagerSynchronization = formatDate(req.query['userConfigurationPreviousDogManagerSynchronization']);
    const isRetrievingReminders = formatBoolean(req.query['isRetrievingReminders']) ?? false;
    const isRetrievingLogs = formatBoolean(req.query['isRetrievingLogs']) ?? false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const signedPayload = formatUnknownString(req.body['signedPayload']);

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'getDogs', ERROR_CODES.VALUE.INVALID);
    }
    if (signedPayload === undefined) {
      throw new HoundError('signedPayload missing', 'getDogs', ERROR_CODES.VALUE.INVALID);
    }

    if (validatedDogId !== undefined) {
      const result = await getDogForDogId(databaseConnection, validatedDogId, isRetrievingReminders, isRetrievingLogs, userConfigurationPreviousDogManagerSynchronization);

      if (result === undefined) {
        throw new HoundError('getDogForDogId  result undefined', 'getDogs', ERROR_CODES.VALUE.INVALID);
      }
      return res.extendedProperties.sendSuccessResponse(result);
    }

    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', 'getDogs', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', 'getDogs', ERROR_CODES.VALUE.INVALID);
    }

    const result = await getAllDogsForUserIdFamilyId(
      databaseConnection,
      validatedUserId,
      validatedFamilyId,
      isRetrievingReminders,
      isRetrievingLogs,
      userConfigurationPreviousDogManagerSynchronization,
    );

    if (result === undefined) {
      throw new HoundError('getAllDogsForUserIdFamilyId result undefined', 'getDogs', ERROR_CODES.VALUE.INVALID);
    }

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'createDog', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', 'createDog', ERROR_CODES.VALUE.INVALID);
    }
    if (dogName === undefined) {
      throw new HoundError('dogName missing', 'createDog', ERROR_CODES.VALUE.INVALID);
    }

    const result = await createDogForFamilyId(databaseConnection, validatedFamilyId, dogName);

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function updateDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedDogId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'updateDog', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', 'updateDog', ERROR_CODES.VALUE.INVALID);
    }
    if (dogName === undefined) {
      throw new HoundError('dogName missing', 'updateDog', ERROR_CODES.VALUE.INVALID);
    }

    await updateDogForDogId(databaseConnection, validatedDogId, dogName);

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function deleteDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId, validatedDogId } = req.extendedProperties.validatedVariables;
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'deleteDog', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', 'deleteDog', ERROR_CODES.VALUE.INVALID);
    }
    if (validatedDogId === undefined) {
      throw new HoundError('validatedDogId missing', 'deleteDog', ERROR_CODES.VALUE.INVALID);
    }

    await deleteDogForFamilyIdDogId(databaseConnection, validatedFamilyId, validatedDogId);

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
