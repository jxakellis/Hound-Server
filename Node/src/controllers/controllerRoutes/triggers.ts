import express from 'express';

import { getTriggerForTriggerUUID, getAllTriggersForDogUUID } from '../get/triggers/getTriggers.js';

import { createTriggersForTriggers } from '../create/triggers/createTriggers.js';

import { updateTriggersForTriggers } from '../update/triggers/updateTriggers.js';

import { deleteTriggersTriggerUUIDs } from '../delete/deleteTriggers.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import {
  formatArray,
  formatDate, formatNumber, formatUnknownString,
} from '../../main/format/formatObject.js';
import { type NotYetCreatedDogTriggersRow, type NotYetUpdatedDogTriggersRow } from '../../main/types/DogTriggersRow.js';

async function getTriggers(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getTriggers, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', getTriggers, ERROR_CODES.VALUE.MISSING);
    }

    const { validatedTriggers } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedTrigger = validatedTriggers.safeIndex(0);

    if (validatedTrigger !== undefined && validatedTrigger !== null) {
      const possibleDeletedTrigger = await getTriggerForTriggerUUID(databaseConnection, validatedTrigger.validatedTriggerUUID, true);

      if (possibleDeletedTrigger === undefined || possibleDeletedTrigger === null) {
        throw new HoundError('getTriggerForTriggerUUID possibleDeletedTrigger missing', getTriggers, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndDeclarationExtendedProperties.sendSuccessResponse(possibleDeletedTrigger);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedTriggers = await getAllTriggersForDogUUID(databaseConnection, validatedDog.validatedDogUUID, true, previousDogManagerSynchronization);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(possibleDeletedTriggers);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createTrigger(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedDogs } = req.houndDeclarationExtendedProperties.validatedVariables;
    const validatedDog = validatedDogs.safeIndex(0);
    const { unvalidatedTriggersDictionary } = req.houndDeclarationExtendedProperties.unvalidatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (unvalidatedTriggersDictionary === undefined || unvalidatedTriggersDictionary === null) {
      throw new HoundError('unvalidatedTriggersDictionary missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }

    const triggers: NotYetCreatedDogTriggersRow[] = [];
    unvalidatedTriggersDictionary.forEach((unvalidatedTriggerDictionary) => {
      const triggerUUID = formatUnknownString(unvalidatedTriggerDictionary['triggerUUID'], 36);
      const triggerCustomName = formatUnknownString(unvalidatedTriggerDictionary['triggerCustomName']);
      const logActionReactions = formatArray(unvalidatedTriggerDictionary['logActionReactions'])
        ?.map((lar) => formatUnknownString(lar))
        .filter((lar): lar is string => lar !== undefined);
      const logCustomActionNameReactions = formatArray(unvalidatedTriggerDictionary['logCustomActionNameReactions'])
        ?.map((lar) => formatUnknownString(lar))
        .filter((lar): lar is string => lar !== undefined);
      const triggerType = formatUnknownString(unvalidatedTriggerDictionary['triggerType']);
      const triggerTimeDelay = formatNumber(unvalidatedTriggerDictionary['triggerTimeDelay']);
      const triggerFixedTimeType = formatUnknownString(unvalidatedTriggerDictionary['triggerFixedTimeType']);
      const triggerFixedTimeTypeAmount = formatNumber(unvalidatedTriggerDictionary['triggerFixedTimeTypeAmount']);
      const triggerFixedTimeUTCHour = formatNumber(unvalidatedTriggerDictionary['triggerFixedTimeUTCHour']);
      const triggerFixedTimeUTCMinute = formatNumber(unvalidatedTriggerDictionary['triggerFixedTimeUTCMinute']);

      if (triggerUUID === undefined || triggerUUID === null) {
        throw new HoundError('triggerUUID missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerCustomName === undefined || triggerCustomName === null) {
        throw new HoundError('triggerCustomName missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (logActionReactions === undefined || logActionReactions === null) {
        throw new HoundError('logActionReactions missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (logCustomActionNameReactions === undefined || logCustomActionNameReactions === null) {
        throw new HoundError('logCustomActionNameReactions missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerType === undefined || triggerType === null) {
        throw new HoundError('triggerType missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerTimeDelay === undefined || triggerTimeDelay === null) {
        throw new HoundError('triggerTimeDelay missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeType === undefined || triggerFixedTimeType === null) {
        throw new HoundError('triggerFixedTimeType missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeTypeAmount === undefined || triggerFixedTimeTypeAmount === null) {
        throw new HoundError('triggerFixedTimeTypeAmount missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeUTCHour === undefined || triggerFixedTimeUTCHour === null) {
        throw new HoundError('triggerFixedTimeUTCHour missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeUTCMinute === undefined || triggerFixedTimeUTCMinute === null) {
        throw new HoundError('triggerFixedTimeUTCMinute missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }

      triggers.push({
        dogUUID: validatedDog.validatedDogUUID,
        triggerUUID,
        triggerCustomName,
        logActionReactions,
        logCustomActionNameReactions,
        triggerType,
        triggerTimeDelay,
        triggerFixedTimeType,
        triggerFixedTimeTypeAmount,
        triggerFixedTimeUTCHour,
        triggerFixedTimeUTCMinute,
      });
    });

    const results = await createTriggersForTriggers(databaseConnection, triggers);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(results);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateTrigger(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedTriggers } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedTriggers === undefined || validatedTriggers === null) {
      throw new HoundError('validatedTriggers missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
    }

    const triggers: NotYetUpdatedDogTriggersRow[] = [];
    validatedTriggers.forEach((validatedTrigger) => {
      // validate trigger id against validatedTriggers
      const triggerId = validatedTrigger.validatedTriggerId;
      const triggerUUID = validatedTrigger.validatedTriggerUUID;
      const dogUUID = validatedTrigger.validatedDogUUID;
      const triggerCustomName = formatUnknownString(validatedTrigger.unvalidatedTriggerDictionary?.['triggerCustomName']);
      const logActionReactions = formatArray(validatedTrigger.unvalidatedTriggerDictionary?.['logActionReactions'])
        ?.map((lar) => formatUnknownString(lar))
        .filter((lar): lar is string => lar !== undefined);
      const logCustomActionNameReactions = formatArray(validatedTrigger.unvalidatedTriggerDictionary?.['logCustomActionNameReactions'])
        ?.map((lar) => formatUnknownString(lar))
        .filter((lar): lar is string => lar !== undefined);
      const triggerType = formatUnknownString(validatedTrigger.unvalidatedTriggerDictionary?.['triggerType']);
      const triggerTimeDelay = formatNumber(validatedTrigger.unvalidatedTriggerDictionary?.['triggerTimeDelay']);
      const triggerFixedTimeType = formatUnknownString(validatedTrigger.unvalidatedTriggerDictionary?.['triggerFixedTimeType']);
      const triggerFixedTimeTypeAmount = formatNumber(validatedTrigger.unvalidatedTriggerDictionary?.['triggerFixedTimeTypeAmount']);
      const triggerFixedTimeUTCHour = formatNumber(validatedTrigger.unvalidatedTriggerDictionary?.['triggerFixedTimeUTCHour']);
      const triggerFixedTimeUTCMinute = formatNumber(validatedTrigger.unvalidatedTriggerDictionary?.['triggerFixedTimeUTCMinute']);

      if (triggerUUID === undefined || triggerUUID === null) {
        throw new HoundError('triggerUUID missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerCustomName === undefined || triggerCustomName === null) {
        throw new HoundError('triggerCustomName missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (logActionReactions === undefined || logActionReactions === null) {
        throw new HoundError('logActionReactions missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (logCustomActionNameReactions === undefined || logCustomActionNameReactions === null) {
        throw new HoundError('logCustomActionNameReactions missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerType === undefined || triggerType === null) {
        throw new HoundError('triggerType missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerTimeDelay === undefined || triggerTimeDelay === null) {
        throw new HoundError('triggerTimeDelay missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeType === undefined || triggerFixedTimeType === null) {
        throw new HoundError('triggerFixedTimeType missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeTypeAmount === undefined || triggerFixedTimeTypeAmount === null) {
        throw new HoundError('triggerFixedTimeTypeAmount missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeUTCHour === undefined || triggerFixedTimeUTCHour === null) {
        throw new HoundError('triggerFixedTimeUTCHour missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeUTCMinute === undefined || triggerFixedTimeUTCMinute === null) {
        throw new HoundError('triggerFixedTimeUTCMinute missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }

      triggers.push({
        triggerId,
        triggerUUID,
        dogUUID,
        triggerCustomName,
        logActionReactions,
        logCustomActionNameReactions,
        triggerType,
        triggerTimeDelay,
        triggerFixedTimeType,
        triggerFixedTimeTypeAmount,
        triggerFixedTimeUTCHour,
        triggerFixedTimeUTCMinute,
      });
    });

    await updateTriggersForTriggers(databaseConnection, triggers);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteTrigger(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedFamilyId, validatedTriggers } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedTriggers === undefined || validatedTriggers === null) {
      throw new HoundError('validatedTriggers missing', deleteTrigger, ERROR_CODES.VALUE.MISSING);
    }

    await deleteTriggersTriggerUUIDs(databaseConnection, validatedTriggers.map((validatedTrigger) => validatedTrigger.validatedTriggerUUID));

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getTriggers, createTrigger, updateTrigger, deleteTrigger,
};
