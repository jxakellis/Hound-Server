const express = require('express');

const alertRouter = express.Router({ mergeParams: true });

const { ValidationError } = require('../main/tools/general/errors');
const { areAllDefined } = require('../main/tools/format/validateDefined');
const { createTerminateNotification } = require('../main/tools/notifications/alert/createTerminateNotification');

// User has done some action that warrents us sending them a special notification
alertRouter.post('/:alertType', async (req, res) => {
  const { alertType } = req.params;
  if (areAllDefined(alertType) === false) {
    return res.sendResponseForStatusJSONError(400, undefined, new ValidationError('No alert type provided', global.constant.error.value.INVALID));
  }
  // the user has terminated the app
  if (alertType === global.constant.notification.category.user.TERMINATE) {
    createTerminateNotification(req.params.userId);
  }
  return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
});
// no body

module.exports = { alertRouter };
