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
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getDogs, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', getDogs, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', getDogs, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    const { validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);
    const isRetrievingReminders = formatBoolean(req.query['isRetrievingReminders']) ?? false;
    const isRetrievingLogs = formatBoolean(req.query['isRetrievingLogs']) ?? false;

    if (validatedDogId !== undefined && validatedDogId !== null) {
      const result = await getDogForDogId(databaseConnection, validatedDogId, isRetrievingReminders, isRetrievingLogs, previousDogManagerSynchronization);

      if (result === undefined || result === null) {
        throw new HoundError('getDogForDogId result undefined', getDogs, ERROR_CODES.VALUE.INVALID);
      }
      return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
    }

    const result = await getAllDogsForUserIdFamilyId(
      databaseConnection,
      validatedUserId,
      validatedFamilyId,
      isRetrievingReminders,
      isRetrievingLogs,
      previousDogManagerSynchronization,
    );

    if (result === undefined || result === null) {
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
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', createDog, ERROR_CODES.VALUE.INVALID);
    }

    const result = await createDogForFamilyId(databaseConnection, { familyId: validatedFamilyId, dogName });

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedDogId === null) {
      throw new HoundError('No family found or invalid permissions', updateDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', updateDog, ERROR_CODES.VALUE.INVALID);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', updateDog, ERROR_CODES.VALUE.INVALID);
    }

    await updateDogForDogId(databaseConnection, { familyId: validatedFamilyId, dogId: validatedDogId, dogName });

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteDog, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDogId === undefined || validatedDogId === null) {
      throw new HoundError('validatedDogId missing', deleteDog, ERROR_CODES.VALUE.INVALID);
    }

    await deleteDogForFamilyIdDogId(databaseConnection, validatedFamilyId, validatedDogId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
