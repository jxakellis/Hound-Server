const express = require('express');

const alertRouter = express.Router({ mergeParams: true });

const { ValidationError } = require('../main/tools/general/errors');
const { areAllDefined } = require('../main/tools/validate/validateDefined');
const { createTerminateNotification } = require('../main/tools/notifications/alert/createTerminateNotification');

// User has done some action that warrents us sending them a special notification
alertRouter.post('/:alertType', async (req, res) => {
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

module.exports = { alertRouter };
