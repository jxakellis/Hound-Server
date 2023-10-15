import express from 'express';

const alertRouter = express.Router({ mergeParams: true });

const { ValidationError } from '../main/server/globalErrors';
const { areAllDefined } from '../main/tools/validate/validateDefined';
const { createTerminateNotification } from '../main/tools/notifications/alert/createTerminateNotification';

// User has done some action that warrents us sending them a special notification
alertRouter.post('/:alertType', async (req: express.Request, res: express.Response) => {
  const { alertType } = req.params;
  if (areAllDefined(alertType) === false) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new ValidationError('No alert type provided', ERROR_CODES.VALUE.INVALID));
  }
  // the user has terminated the app
  if (alertType === NOTIFICATION.CATEGORY.USER.TERMINATE) {
    createTerminateNotification(req.params.userId);
  }
  return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
});
// no body

export { alertRouter };
