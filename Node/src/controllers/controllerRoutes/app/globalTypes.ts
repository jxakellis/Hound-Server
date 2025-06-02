import express from 'express';

import { ERROR_CODES, HoundError } from '../../../main/server/globalErrors.js';
import type { GlobalTypes } from '../../../main/types/GlobalTypes.js';
import { getAllLogActionTypes } from '../../get/types/getLogActionType.js';
import { getAllReminderActionTypes } from '../../get/types/getReminderActionType.js';
import { getAllMappingLogActionTypeReminderActionType } from '../../get/types/getMappingLogActionTypeReminderActionType.js';
import { getAllLogUnitTypes } from '../../../controllers/get/types/getLogUnitType.js';
import { getAllMappingLogActionTypeLogUnitType } from '../../../controllers/get/types/getMappingLogActionTypeLogUnitType.js';

async function getGlobalTypes(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getGlobalTypes, ERROR_CODES.VALUE.MISSING);
    }

    const [
      logActionType,
      reminderActionType,
      mappingLogActionTypeReminderActionType,
      logUnitType,
      mappingLogActionTypeLogUnitType,
    ] = await Promise.all([
      getAllLogActionTypes(databaseConnection),
      getAllReminderActionTypes(databaseConnection),
      getAllMappingLogActionTypeReminderActionType(databaseConnection),
      getAllLogUnitTypes(databaseConnection),
      getAllMappingLogActionTypeLogUnitType(databaseConnection),
    ]);

    const result: GlobalTypes = {
      logActionType,
      reminderActionType,
      mappingLogActionTypeReminderActionType,
      logUnitType,
      mappingLogActionTypeLogUnitType,
    };

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getGlobalTypes,
};
