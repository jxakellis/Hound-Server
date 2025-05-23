import express from 'express';

import { ERROR_CODES, HoundError } from '../../../main/server/globalErrors.js';
import type { GlobalTypes } from '../../../main/types/Types.js';
import { getAllLogActionTypes } from '../../../controllers/get/types/getLogActionType.js';
import { getAllReminderActionTypes } from '../../../controllers/get/types/getReminderActionType.js';
import { getAllMappingLogActionTypeReminderActionType } from '../../../controllers/get/types/getMappingLogActionTypeReminderActionType.js';

async function getTypes(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getTypes, ERROR_CODES.VALUE.MISSING);
    }

    const result: GlobalTypes = {
      logActionType: await getAllLogActionTypes(databaseConnection),
      reminderActionType: await getAllReminderActionTypes(databaseConnection),
      mappingLogActionTypeReminderActionType: await getAllMappingLogActionTypeReminderActionType(databaseConnection),
    };

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getTypes,
};
