const express = require('express');

const subscriptionsRouter = express.Router({ mergeParams: true });

const {
  getInAppSubscriptions, createInAppSubscriptions,
} = require('../controllers/controllerRoutes/inAppSubscriptions');

//
subscriptionsRouter.get('/', getInAppSubscriptions);
// no body

//
subscriptionsRouter.post('/', createInAppSubscriptions);
/* BODY:
*/

module.exports = { subscriptionsRouter };
