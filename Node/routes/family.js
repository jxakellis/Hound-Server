const express = require('express');

const familyRouter = express.Router({ mergeParams: true });

const { addFamilyIdToLogRequest } = require('../main/tools/logging/logRequest');

const {
  getFamily, createFamily, updateFamily, deleteFamily,
} = require('../controllers/controllerRoutes/family');

const { validateFamilyId } = require('../main/tools/format/validateId');

familyRouter.param('familyId', validateFamilyId);
// If familyId is successfully validated, then we add it to the request
familyRouter.param('familyId', addFamilyIdToLogRequest);

const { attachActiveSubscription } = require('../main/tools/format/validateSubscription');

familyRouter.use('/:familyId', attachActiveSubscription);

// route to dogs (or nested) related things
const { dogsRouter } = require('./dogs');

familyRouter.use('/:familyId/dogs', dogsRouter);

// route to subscription related things
const { subscriptionsRouter } = require('./inAppSubscriptions');

familyRouter.use('/:familyId/subscriptions', subscriptionsRouter);

// gets family with familyId then return information from families and familyMembers table
familyRouter.get('/:familyId', getFamily);
// no body

// creates family
familyRouter.post('/', createFamily);
/* BODY:
*/

// updates family
// no familyId indicates that the user might be joining a family with a familyCode.
familyRouter.put('/', updateFamily);
// familyId indicates that the user might be updating the family
familyRouter.put('/:familyId', updateFamily);

// deletes family
familyRouter.delete('/:familyId', deleteFamily);
// no body

module.exports = { familyRouter };
