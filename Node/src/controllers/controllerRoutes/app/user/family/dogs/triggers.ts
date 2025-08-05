import express from 'express';

import { getTriggerForTriggerUUID, getAllTriggersForDogUUID } from '../../../../../get/triggers/getTriggers.js';

import { createTriggersForTriggers } from '../../../../../create/triggers/createTriggers.js';

import { updateTriggersForTriggers } from '../../../../../update/triggers/updateTriggers.js';

import { deleteTriggersTriggerUUIDs } from '../../../../../delete/deleteTriggers.js';
import { ERROR_CODES, HoundError } from '../../../../../../main/server/globalErrors.js';

import {
  formatArray,
  formatDate, formatDict, formatNumber, formatUnknownString,
} from '../../../../../../main/format/formatObject.js';
import { type NotYetCreatedDogTriggersRow, type NotYetUpdatedDogTriggersRow } from '../../../../../../main/types/rows/DogTriggersRow.js';

async function getTriggers(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedDogs } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getTriggers, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', getTriggers, ERROR_CODES.VALUE.MISSING);
    }

    const { validatedTriggers } = req.houndProperties.validatedVars;
    const validatedTrigger = validatedTriggers.safeIndex(0);

    if (validatedTrigger !== undefined && validatedTrigger !== null) {
      const possibleDeletedTrigger = await getTriggerForTriggerUUID(databaseConnection, validatedTrigger.validatedTriggerUUID, true);

      if (possibleDeletedTrigger === undefined || possibleDeletedTrigger === null) {
        throw new HoundError('getTriggerForTriggerUUID possibleDeletedTrigger missing', getTriggers, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possibleDeletedTrigger);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedTriggers = await getAllTriggersForDogUUID(databaseConnection, validatedDog.validatedDogUUID, true, previousDogManagerSynchronization);

    return res.houndProperties.sendSuccessResponse(possibleDeletedTriggers);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createTrigger(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedDogs, validatedUserId } = req.houndProperties.validatedVars;
    const validatedDog = validatedDogs.safeIndex(0);
    const { unvalidatedTriggersDict } = req.houndProperties.unvalidatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedDog === undefined || validatedDog === null) {
      throw new HoundError('validatedDog missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (unvalidatedTriggersDict === undefined || unvalidatedTriggersDict === null) {
      throw new HoundError('unvalidatedTriggersDict missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }

    const triggers: NotYetCreatedDogTriggersRow[] = [];
    unvalidatedTriggersDict.forEach((unvalidatedTriggerDict) => {
      const triggerUUID = formatUnknownString(unvalidatedTriggerDict['triggerUUID'], 36);
      if (triggerUUID === undefined || triggerUUID === null) {
        throw new HoundError('triggerUUID missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }

      const logReactionsRaw = formatArray(unvalidatedTriggerDict['triggerLogReactions']);
      if (logReactionsRaw === undefined) {
        throw new HoundError('triggerLogReactions missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      const triggerLogReactions = logReactionsRaw.map((raw) => {
        const rawTriggerLogReaction = formatDict(raw);
        if (rawTriggerLogReaction === undefined) {
          throw new HoundError('triggerLogReaction missing in triggerLogReactions', createTrigger, ERROR_CODES.VALUE.MISSING);
        }
        const logActionTypeId = formatNumber(rawTriggerLogReaction['logActionTypeId']);
        const logCustomActionName = formatUnknownString(rawTriggerLogReaction['logCustomActionName']);
        if (logActionTypeId === undefined) {
          throw new HoundError('logActionTypeId missing in triggerLogReactions', createTrigger, ERROR_CODES.VALUE.MISSING);
        }
        if (logCustomActionName === undefined) {
          throw new HoundError('logCustomActionName missing in triggerLogReactions', createTrigger, ERROR_CODES.VALUE.MISSING);
        }
        return { triggerUUID, logActionTypeId, logCustomActionName };
      });
      const rawTriggerReminderResult = formatDict(unvalidatedTriggerDict['triggerReminderResult']);
      if (rawTriggerReminderResult === undefined || rawTriggerReminderResult === null) {
        throw new HoundError('triggerReminderResult missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      const reminderActionTypeId = formatNumber(rawTriggerReminderResult['reminderActionTypeId']);
      const reminderCustomActionName = formatUnknownString(rawTriggerReminderResult['reminderCustomActionName']);
      if (reminderActionTypeId === undefined) {
        throw new HoundError('reminderActionTypeId missing in triggerReminderResult', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined) {
        throw new HoundError('reminderCustomActionName missing in triggerReminderResult', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      const triggerReminderResult = { triggerUUID, reminderActionTypeId, reminderCustomActionName };
      const triggerType = formatUnknownString(unvalidatedTriggerDict['triggerType']);
      const triggerTimeDelay = formatNumber(unvalidatedTriggerDict['triggerTimeDelay']);
      const triggerFixedTimeType = formatUnknownString(unvalidatedTriggerDict['triggerFixedTimeType']);
      const triggerFixedTimeTypeAmount = formatNumber(unvalidatedTriggerDict['triggerFixedTimeTypeAmount']);
      const triggerFixedTimeHour = formatNumber(unvalidatedTriggerDict['triggerFixedTimeHour']);
      const triggerFixedTimeMinute = formatNumber(unvalidatedTriggerDict['triggerFixedTimeMinute']);
      const triggerManualCondition = formatNumber(unvalidatedTriggerDict['triggerManualCondition']);
      const triggerAlarmCreatedCondition = formatNumber(unvalidatedTriggerDict['triggerAlarmCreatedCondition']);

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
      if (triggerFixedTimeHour === undefined || triggerFixedTimeHour === null) {
        throw new HoundError('triggerFixedTimeHour missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeMinute === undefined || triggerFixedTimeMinute === null) {
        throw new HoundError('triggerFixedTimeMinute missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerManualCondition === undefined || triggerManualCondition === null) {
        throw new HoundError('triggerManualCondition missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerAlarmCreatedCondition === undefined || triggerAlarmCreatedCondition === null) {
        throw new HoundError('triggerAlarmCreatedCondition missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }

      triggers.push({
        dogUUID: validatedDog.validatedDogUUID,
        triggerUUID,
        triggerLogReactions,
        triggerReminderResult,
        triggerType,
        triggerTimeDelay,
        triggerFixedTimeType,
        triggerFixedTimeTypeAmount,
        triggerFixedTimeHour,
        triggerFixedTimeMinute,
        triggerManualCondition,
        triggerAlarmCreatedCondition,
        triggerCreatedBy: validatedUserId,
      });
    });

    const results = await createTriggersForTriggers(databaseConnection, triggers);

    return res.houndProperties.sendSuccessResponse(results);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function updateTrigger(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedTriggers, validatedUserId } = req.houndProperties.validatedVars;
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

      if (triggerUUID === undefined || triggerUUID === null) {
        throw new HoundError('triggerUUID missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }

      const logReactionsRaw = formatArray(validatedTrigger.unvalidatedTriggerDict?.['triggerLogReactions']);
      if (logReactionsRaw === undefined) {
        throw new HoundError('triggerLogReactions missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      const triggerLogReactions = logReactionsRaw.map((raw) => {
        const rawTriggerLogReaction = formatDict(raw);
        if (rawTriggerLogReaction === undefined) {
          throw new HoundError('triggerLogReaction missing in triggerLogReactions', updateTrigger, ERROR_CODES.VALUE.MISSING);
        }
        const logActionTypeId = formatNumber(rawTriggerLogReaction['logActionTypeId']);
        const logCustomActionName = formatUnknownString(rawTriggerLogReaction['logCustomActionName']);
        if (logActionTypeId === undefined) {
          throw new HoundError('logActionTypeId missing in triggerLogReactions', updateTrigger, ERROR_CODES.VALUE.MISSING);
        }
        if (logCustomActionName === undefined) {
          throw new HoundError('logCustomActionName missing in triggerLogReactions', updateTrigger, ERROR_CODES.VALUE.MISSING);
        }
        return { triggerUUID, logActionTypeId, logCustomActionName };
      });
      const rawTriggerReminderResult = formatDict(validatedTrigger.unvalidatedTriggerDict?.['triggerReminderResult']);
      if (rawTriggerReminderResult === undefined || rawTriggerReminderResult === null) {
        throw new HoundError('triggerReminderResult missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      const reminderActionTypeId = formatNumber(rawTriggerReminderResult['reminderActionTypeId']);
      const reminderCustomActionName = formatUnknownString(rawTriggerReminderResult['reminderCustomActionName']);
      if (reminderActionTypeId === undefined) {
        throw new HoundError('reminderActionTypeId missing in triggerReminderResult', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (reminderCustomActionName === undefined) {
        throw new HoundError('reminderCustomActionName missing in triggerReminderResult', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      const triggerReminderResult = { triggerUUID, reminderActionTypeId, reminderCustomActionName };

      const triggerType = formatUnknownString(validatedTrigger.unvalidatedTriggerDict?.['triggerType']);
      const triggerTimeDelay = formatNumber(validatedTrigger.unvalidatedTriggerDict?.['triggerTimeDelay']);
      const triggerFixedTimeType = formatUnknownString(validatedTrigger.unvalidatedTriggerDict?.['triggerFixedTimeType']);
      const triggerFixedTimeTypeAmount = formatNumber(validatedTrigger.unvalidatedTriggerDict?.['triggerFixedTimeTypeAmount']);
      const triggerFixedTimeHour = formatNumber(validatedTrigger.unvalidatedTriggerDict?.['triggerFixedTimeHour']);
      const triggerFixedTimeMinute = formatNumber(validatedTrigger.unvalidatedTriggerDict?.['triggerFixedTimeMinute']);
      const triggerManualCondition = formatNumber(validatedTrigger.unvalidatedTriggerDict?.['triggerManualCondition']);
      const triggerAlarmCreatedCondition = formatNumber(validatedTrigger.unvalidatedTriggerDict?.['triggerAlarmCreatedCondition']);

      if (triggerType === undefined || triggerType === null) {
        throw new HoundError('triggerType missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerTimeDelay === undefined || triggerTimeDelay === null) {
        throw new HoundError('triggerTimeDelay missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeType === undefined || triggerFixedTimeType === null) {
        throw new HoundError('triggerFixedTimeType missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeTypeAmount === undefined || triggerFixedTimeTypeAmount === null) {
        throw new HoundError('triggerFixedTimeTypeAmount missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeHour === undefined || triggerFixedTimeHour === null) {
        throw new HoundError('triggerFixedTimeHour missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerFixedTimeMinute === undefined || triggerFixedTimeMinute === null) {
        throw new HoundError('triggerFixedTimeMinute missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerManualCondition === undefined || triggerManualCondition === null) {
        throw new HoundError('triggerManualCondition missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }
      if (triggerAlarmCreatedCondition === undefined || triggerAlarmCreatedCondition === null) {
        throw new HoundError('triggerAlarmCreatedCondition missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }

      triggers.push({
        triggerId,
        triggerUUID,
        dogUUID,
        triggerLogReactions,
        triggerReminderResult,
        triggerType,
        triggerTimeDelay,
        triggerFixedTimeType,
        triggerFixedTimeTypeAmount,
        triggerFixedTimeHour,
        triggerFixedTimeMinute,
        triggerManualCondition,
        triggerAlarmCreatedCondition,
        triggerLastModifiedBy: validatedUserId,
      });
    });

    await updateTriggersForTriggers(databaseConnection, triggers);

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function deleteTrigger(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { validatedFamilyId, validatedTriggers, validatedUserId } = req.houndProperties.validatedVars;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteTrigger, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (validatedTriggers === undefined || validatedTriggers === null) {
      throw new HoundError('validatedTriggers missing', deleteTrigger, ERROR_CODES.VALUE.MISSING);
    }

    await deleteTriggersTriggerUUIDs(
      databaseConnection,
      validatedTriggers.map((validatedTrigger) => validatedTrigger.validatedTriggerUUID),
      validatedUserId,
    );

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getTriggers, createTrigger, updateTrigger, deleteTrigger,
};
