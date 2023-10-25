import express from 'express';
import { formatUnknownString } from '../main/format/formatObject.js';
import { ERROR_CODES, HoundError } from '../main/server/globalErrors.js';
import { NOTIFICATION } from '../main/server/globalConstants.js';
import { createTerminateNotification } from '../main/tools/notifications/alert/createTerminateNotification.js';

const alertRouter = express.Router({ mergeParams: true });

// User has done some action that warrents us sending them a special notification
alertRouter.post(['/:alertType'], async (req: express.Request, res: express.Response) => {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', alertRouter.post, ERROR_CODES.PERMISSION.NO.USER);
    }

    const alertType = formatUnknownString(req.params['alertType']);

    if (alertType === undefined || alertType === null) {
      throw new HoundError('alertType missing', alertRouter.post, ERROR_CODES.VALUE.INVALID);
    }

    // the user has terminated the app
    if (alertType === NOTIFICATION.CATEGORY.USER.TERMINATE) {
      createTerminateNotification(validatedUserId);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
});
// no body

export { alertRouter };
