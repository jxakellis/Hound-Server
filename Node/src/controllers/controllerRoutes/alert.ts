import express from 'express';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { createTerminateNotification } from '../../main/tools/notifications/alert/createTerminateNotification.js';

// TODO NOW test createTerminateAlert

async function createTerminateAlert(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', createTerminateAlert, ERROR_CODES.PERMISSION.NO.USER);
    }

    createTerminateNotification(validatedUserId);

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  createTerminateAlert,
};
