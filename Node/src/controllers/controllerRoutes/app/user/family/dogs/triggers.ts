import express from 'express';

import { getTriggerForTriggerUUID, getAllTriggersForDogUUID } from '../../../../../get/triggers/getTriggers.js';

import { createTriggersForTriggers } from '../../../../../create/triggers/createTriggers.js';

import { updateTriggersForTriggers } from '../../../../../update/triggers/updateTriggers.js';

import { deleteTriggersTriggerUUIDs } from '../../../../../delete/triggers/deleteTriggers.js';
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
    const { authDogs } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getTriggers, ERROR_CODES.VALUE.MISSING);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', getTriggers, ERROR_CODES.VALUE.MISSING);
    }

    const { authTriggers } = req.houndProperties.authenticated;
    const authTrigger = authTriggers.safeIndex(0);

    if (authTrigger !== undefined && authTrigger !== null) {
      const possibleDeletedTrigger = await getTriggerForTriggerUUID(databaseConnection, authTrigger.authTrigger.triggerUUID, true);

      if (possibleDeletedTrigger === undefined || possibleDeletedTrigger === null) {
        throw new HoundError('getTriggerForTriggerUUID possibleDeletedTrigger missing', getTriggers, ERROR_CODES.VALUE.MISSING);
      }

      return res.houndProperties.sendSuccessResponse(possibleDeletedTrigger);
    }

    const previousDogManagerSynchronization = formatDate(req.query['previousDogManagerSynchronization'] ?? req.query['userConfigurationPreviousDogManagerSynchronization']);

    const possibleDeletedTriggers = await getAllTriggersForDogUUID(databaseConnection, authDog.authDog.dogUUID, true, previousDogManagerSynchronization);

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
    const { authFamilyId, authDogs, authUserId } = req.houndProperties.authenticated;
    const authDog = authDogs.safeIndex(0);
    const { unauthTriggersDict } = req.houndProperties.unauthenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', createTrigger, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authDog === undefined || authDog === null) {
      throw new HoundError('authDog missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (unauthTriggersDict === undefined || unauthTriggersDict === null) {
      throw new HoundError('unauthTriggersDict missing', createTrigger, ERROR_CODES.VALUE.MISSING);
    }

    const triggers: NotYetCreatedDogTriggersRow[] = [];
    unauthTriggersDict.forEach((unauthNewTriggerDict) => {
      const triggerUUID = formatUnknownString(unauthNewTriggerDict['triggerUUID'], 36);
      if (triggerUUID === undefined || triggerUUID === null) {
        throw new HoundError('triggerUUID missing', createTrigger, ERROR_CODES.VALUE.MISSING);
      }

      const logReactionsRaw = formatArray(unauthNewTriggerDict['triggerLogReactions']);
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
      const rawTriggerReminderResult = formatDict(unauthNewTriggerDict['triggerReminderResult']);
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
      const triggerType = formatUnknownString(unauthNewTriggerDict['triggerType']);
      const triggerTimeDelay = formatNumber(unauthNewTriggerDict['triggerTimeDelay']);
      const triggerFixedTimeType = formatUnknownString(unauthNewTriggerDict['triggerFixedTimeType']);
      const triggerFixedTimeTypeAmount = formatNumber(unauthNewTriggerDict['triggerFixedTimeTypeAmount']);
      const triggerFixedTimeHour = formatNumber(unauthNewTriggerDict['triggerFixedTimeHour']);
      const triggerFixedTimeMinute = formatNumber(unauthNewTriggerDict['triggerFixedTimeMinute']);
      const triggerManualCondition = formatNumber(unauthNewTriggerDict['triggerManualCondition']);
      const triggerAlarmCreatedCondition = formatNumber(unauthNewTriggerDict['triggerAlarmCreatedCondition']);

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
        dogUUID: authDog.authDog.dogUUID,
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
        triggerCreatedBy: authUserId,
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
    const { authFamilyId, authTriggers, authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', updateTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authTriggers === undefined || authTriggers === null) {
      throw new HoundError('authTriggers missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
    }

    const triggers: NotYetUpdatedDogTriggersRow[] = [];
    authTriggers.forEach((authTrigger) => {
      // validate trigger id against authTriggers
      const { triggerId } = authTrigger.authTrigger;
      const { triggerUUID } = authTrigger.authTrigger;
      const { dogUUID } = authTrigger.authTrigger;

      if (triggerUUID === undefined || triggerUUID === null) {
        throw new HoundError('triggerUUID missing', updateTrigger, ERROR_CODES.VALUE.MISSING);
      }

      const logReactionsRaw = formatArray(authTrigger.unauthNewTriggerDict?.['triggerLogReactions']);
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
      const rawTriggerReminderResult = formatDict(authTrigger.unauthNewTriggerDict?.['triggerReminderResult']);
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

      const triggerType = formatUnknownString(authTrigger.unauthNewTriggerDict?.['triggerType']);
      const triggerTimeDelay = formatNumber(authTrigger.unauthNewTriggerDict?.['triggerTimeDelay']);
      const triggerFixedTimeType = formatUnknownString(authTrigger.unauthNewTriggerDict?.['triggerFixedTimeType']);
      const triggerFixedTimeTypeAmount = formatNumber(authTrigger.unauthNewTriggerDict?.['triggerFixedTimeTypeAmount']);
      const triggerFixedTimeHour = formatNumber(authTrigger.unauthNewTriggerDict?.['triggerFixedTimeHour']);
      const triggerFixedTimeMinute = formatNumber(authTrigger.unauthNewTriggerDict?.['triggerFixedTimeMinute']);
      const triggerManualCondition = formatNumber(authTrigger.unauthNewTriggerDict?.['triggerManualCondition']);
      const triggerAlarmCreatedCondition = formatNumber(authTrigger.unauthNewTriggerDict?.['triggerAlarmCreatedCondition']);

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
        triggerLastModifiedBy: authUserId,
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
    const { authFamilyId, authTriggers, authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteTrigger, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteTrigger, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', deleteTrigger, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (authTriggers === undefined || authTriggers === null) {
      throw new HoundError('authTriggers missing', deleteTrigger, ERROR_CODES.VALUE.MISSING);
    }

    await deleteTriggersTriggerUUIDs(
      databaseConnection,
      authTriggers.map((authTrigger) => authTrigger.authTrigger.triggerUUID),
      authUserId,
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
