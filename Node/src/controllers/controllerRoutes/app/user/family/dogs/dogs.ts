import express from 'express';

import { getDogForDogUUID, getAllDogsForFamilyId } from '../../../../../get/getDogs.js';

import { createDogForFamilyId } from '../../../../../create/createDogs.js';

import { updateDogForDog } from '../../../../../update/updateDogs.js';

import { deleteDogForFamilyIdDogUUID } from '../../../../../delete/deleteDogs.js';
import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import { formatDate, formatUnknownString } from '../../../../../../main/format/formatObject.js';

async function getDogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserId, authFamilyId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getDogs, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', getDogs, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', getDogs, ERROR_CODES.PERMISSION.NO.FAMILY);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    // See if the user wants a specific dog. If there is no specific dog, then they want them all
    const { authDogs } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    if (authDog !== undefined && authDog !== null) {
      const possiblyDeletedDog = await getDogForDogUUID(
        databaseConnection,
        authDog.authDog.dogUUID,
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
      authFamilyId,
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
    const { authFamilyId, authUserId } = req.houndProperties.authenticated;
    const { unauthDogsDict } = req.houndProperties.unauthenticated;
    const unauthNewDogDict = unauthDogsDict.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createDog, ERROR_CODES.VALUE.MISSING);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (unauthNewDogDict === undefined || unauthNewDogDict === null) {
      throw new HoundError('unauthNewDogDict missing', createDog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogUUID = formatUnknownString(unauthNewDogDict?.['dogUUID'], 36);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(unauthNewDogDict?.['dogName']);
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', createDog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (dogUUID === undefined || dogUUID === null) {
      throw new HoundError('dogUUID missing', createDog, ERROR_CODES.VALUE.MISSING);
    }
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', createDog, ERROR_CODES.VALUE.MISSING);
    }

    const result = await createDogForFamilyId(databaseConnection, {
      familyId: authFamilyId,
      dogUUID,
      dogName,
      dogCreatedBy: authUserId,
    });

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
    const { authFamilyId, authDogs, authUserId } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(authDog.unauthNewDogDict?.['dogName']);
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }

    await updateDogForDog(databaseConnection, {
      familyId: authFamilyId,
      dogId: authDog.authDog.dogId,
      dogUUID: authDog.authDog.dogUUID,
      dogName,
      dogLastModifiedBy: authUserId,
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
    const { authFamilyId, authDogs, authUserId } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteDog, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteDog, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', deleteDog, ERROR_CODES.VALUE.MISSING);
    }

    await deleteDogForFamilyIdDogUUID(databaseConnection, authFamilyId, authDog.authDog.dogUUID, authUserId);

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
