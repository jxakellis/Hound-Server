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
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (signedPayload === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('signedPayload missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    if (validatedDogId !== undefined) {
      const result = await getDogForDogId(databaseConnection, validatedDogId, isRetrievingReminders, isRetrievingLogs, userConfigurationPreviousDogManagerSynchronization);
      return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
    }

    if (validatedUserId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedUserId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const result = await getAllDogsForUserIdFamilyId(
      databaseConnection,
      validatedUserId,
      validatedFamilyId,
      isRetrievingReminders,
      isRetrievingLogs,
      userConfigurationPreviousDogManagerSynchronization,
    );
    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createDog(req: express.Request, res: express.Response): Promise<void> {
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

    const result = await createDogForFamilyId(req.extendedProperties.databaseConnection, validatedFamilyId, dogName);

    return res.extendedProperties.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function updateDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedDogId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedDogId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedDogId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    await updateDogForDogId(databaseConnection, validatedDogId, dogName);
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function deleteDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId, validatedDogId } = req.extendedProperties.validatedVariables;
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedDogId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedDogId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    await deleteDogForFamilyIdDogId(databaseConnection, validatedFamilyId, validatedDogId);
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
