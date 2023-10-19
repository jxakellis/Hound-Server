import express from 'express';
import { formatUnknownString } from '../main/format/formatObject';
import { ERROR_CODES, HoundError } from '../main/server/globalErrors';
import { NOTIFICATION } from '../main/server/globalConstants';
import { createTerminateNotification } from '../main/tools/notifications/alert/createTerminateNotification';

const alertRouter = express.Router({ mergeParams: true });

// User has done some action that warrents us sending them a special notification
alertRouter.post('/:alertType', async (req: express.Request, res: express.Response) => {
  try {
    const { validatedUserId } = req.extendedProperties.validatedVariables;
    const alertType = formatUnknownString(req.params['alertType']);

    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', alertRouter.post, ERROR_CODES.VALUE.INVALID);
    }
    if (alertType === undefined) {
      throw new HoundError('alertType missing', alertRouter.post, ERROR_CODES.VALUE.INVALID);
    }

    // the user has terminated the app
    if (alertType === NOTIFICATION.CATEGORY.USER.TERMINATE) {
      createTerminateNotification(validatedUserId);
    }

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
});
// no body

export { alertRouter };
