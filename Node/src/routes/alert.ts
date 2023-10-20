import express from 'express';
import { formatUnknownString } from '../main/format/formatObject.js';
import { ERROR_CODES, HoundError } from '../main/server/globalErrors.js';
import { NOTIFICATION } from '../main/server/globalConstants.js';
import { createTerminateNotification } from '../main/tools/notifications/alert/createTerminateNotification.js';

const alertRouter = express.Router({ mergeParams: true });

// User has done some action that warrents us sending them a special notification
alertRouter.post('/:alertType', async (req: express.Request, res: express.Response) => {
  try {
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const alertType = formatUnknownString(req.params['alertType']);

    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', alertRouter.post, ERROR_CODES.VALUE.INVALID);
    }
    if (alertType === undefined || alertType === null) {
      throw new HoundError('alertType missing', alertRouter.post, ERROR_CODES.VALUE.INVALID);
    }

    // the user has terminated the app
    if (alertType === NOTIFICATION.CATEGORY.USER.TERMINATE) {
      createTerminateNotification(validatedUserId);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
});
// no body

export { alertRouter };
