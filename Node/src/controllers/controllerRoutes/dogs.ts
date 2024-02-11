import express from 'express';
import crypto from 'crypto';

import { getDogForDogId, getAllDogsForFamilyId } from '../getFor/getForDogs.js';

import { createDogForFamilyId } from '../createFor/createForDogs.js';

import { updateDogForDogId } from '../updateFor/updateForDogs.js';

import { deleteDogForFamilyIdDogId } from '../deleteFor/deleteForDogs.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatDate, formatUnknownString } from '../../main/format/formatObject.js';

async function getDogs(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
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
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    if (validatedDog !== undefined && validatedDog !== null) {
      const possiblyDeletedDog = await getDogForDogId(
        databaseConnection,
        validatedDog.validatedDogId,
        true,
        true,
        previousDogManagerSynchronization,
      );

      if (possiblyDeletedDog === undefined || possiblyDeletedDog === null) {
        throw new HoundError('getDogForDogId possiblyDeletedDog missing', getDogs, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndDeclarationExtendedProperties.sendSuccessResponse(possiblyDeletedDog);
    }

    const possiblyDeletedDogs = await getAllDogsForFamilyId(
      databaseConnection,
      validatedFamilyId,
      true,
      true,
      previousDogManagerSynchronization,
    );

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(possiblyDeletedDogs);
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
    const { unvalidatedDogsDictionary } = req.houndDeclarationExtendedProperties.unvalidatedVariables;
    const unvalidatedDogDictionary = unvalidatedDogsDictionary.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createDog, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createDog, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (unvalidatedDogDictionary === undefined || unvalidatedDogDictionary === null) {
      throw new HoundError('unvalidatedDogDictionary missing', createDog, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogUUID = formatUnknownString(unvalidatedDogDictionary?.['dogUUID'] ?? crypto.randomUUID(), 36);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(unvalidatedDogDictionary?.['dogName']);
    if (dogUUID === undefined || dogUUID === null) {
      throw new HoundError('dogUUID missing', createDog, ERROR_CODES.VALUE.MISSING);
    }
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', createDog, ERROR_CODES.VALUE.MISSING);
    }

    const result = await createDogForFamilyId(databaseConnection, { familyId: validatedFamilyId, dogUUID, dogName });

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
    const { validatedFamilyId, validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
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
    const dogName = formatUnknownString(validatedDog.unvalidatedDogDictionary?.['dogName']);
    if (dogName === undefined || dogName === null) {
      throw new HoundError('dogName missing', updateDog, ERROR_CODES.VALUE.MISSING);
    }

    await updateDogForDogId(databaseConnection, {
      familyId: validatedFamilyId,
      dogId: validatedDog.validatedDogId,
      dogUUID: validatedDog.validatedDogUUID,
      dogName,
    });

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
    const { validatedFamilyId, validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
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

    await deleteDogForFamilyIdDogId(databaseConnection, validatedFamilyId, validatedDog.validatedDogId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};
