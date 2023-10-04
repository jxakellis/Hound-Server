import express from 'express';

const alertRouter = express.Router({ mergeParams: true });

const { ValidationError } from '../main/tools/general/errors';
const { areAllDefined } from '../main/tools/validate/validateDefined';
const { createTerminateNotification } from '../main/tools/notifications/alert/createTerminateNotification';

// User has done some action that warrents us sending them a special notification
alertRouter.post('/:alertType', async (req: express.Request, res: express.Response) => {
  const { alertType } = req.params;
  if (areAllDefined(alertType) === false) {
    return res.sendResponseForStatusBodyError(400, null, new ValidationError('No alert type provided', global.CONSTANT.ERROR.VALUE.INVALID));
  }
  // the user has terminated the app
  if (alertType === global.CONSTANT.NOTIFICATION.CATEGORY.USER.TERMINATE) {
    createTerminateNotification(req.params.userId);
  }
  return res.sendResponseForStatusBodyError(200, null, null);
});
// no body

export { alertRouter };
