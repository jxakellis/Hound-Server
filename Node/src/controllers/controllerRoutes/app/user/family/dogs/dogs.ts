import express from 'express';

import { getDogForDogUUID, getAllDogsForFamilyId } from '../../../../../get/getDogs.js';

import { createDogForFamilyId } from '../../../../../create/createDogs.js';

import { updateDogForDog } from '../../../../../update/updateDogs.js';

import { deleteDogForFamilyIdDogUUID } from '../../../../../delete/deleteDogs.js';
import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import { formatDate, formatUnknownString } from '../../../../../../main/format/formatObject.js';
import { requestLogger } from '../../../../../../main/logging/loggers.js';

async function getDogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    requestLogger.debug('getDogs');
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedUserId, validatedFamilyId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getDogs, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', getDogs, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', getDogs, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    // See if the user wants a specific dog. If there is no specific dog, then they want them all
    const { validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    if (validatedDog !== undefined && validatedDog !== null) {
      const possiblyDeletedDog = await getDogForDogUUID(
        databaseConnection,
        validatedDog.validatedDogUUID,
        true,
        true,
        previousDogManagerSynchronization,
      );

      if (possiblyDeletedDog === undefined || possiblyDeletedDog === null) {
        throw new HoundError('getDogForDogUUID possiblyDeletedDog missing', getDogs, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possiblyDeletedDog);
    }

    const possiblyDeletedDogs = await getAllDogsForFamilyId(
      databaseConnection,
      validatedFamilyId,
      true,
      true,
      previousDogManagerSynchronization,
    );

    return res.houndProperties.sendSuccessResponse(possiblyDeletedDogs);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId } = req.houndProperties.validatedVars;
    const { unvalidatedDogsDict } = req.houndProperties.unvalidatedVars;
    const unvalidatedDogDict = unvalidatedDogsDict.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createDog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (unvalidatedDogDict === undefined || unvalidatedDogDict === null) {
      throw new HoundError('unvalidatedDogDict missing', createDog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogUUID = formatUnknownString(unvalidatedDogDict?.['dogUUID'], 36);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(unvalidatedDogDict?.['dogName']);
    if (dogUUID === undefined || dogUUID === null) {
      throw new HoundError('dogUUID missing', createDog, ERROR_CODES.VALUE.MISSING);
    }
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', createDog, ERROR_CODES.VALUE.MISSING);
    }

    const result = await createDogForFamilyId(databaseConnection, { familyId: validatedFamilyId, dogUUID, dogName });

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function updateDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(validatedDog.unvalidatedDogDict?.['dogName']);
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }

    await updateDogForDog(databaseConnection, {
      familyId: validatedFamilyId,
      dogId: validatedDog.validatedDogId,
      dogUUID: validatedDog.validatedDogUUID,
      dogName,
    });

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function deleteDog(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteDog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', deleteDog, ERROR_CODES.VALUE.MISSING);
    }

    await deleteDogForFamilyIdDogUUID(databaseConnection, validatedFamilyId, validatedDog.validatedDogUUID);

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
