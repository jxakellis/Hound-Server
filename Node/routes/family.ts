const express = require('express';

const familyRouter = express.Router({ mergeParams: true });

const { addFamilyIdToLogRequest } from '../main/tools/logging/logRequest';

const {
  getFamily, createFamily, updateFamily, deleteFamily,
} from ''../controllers/controllerRoutes/family';

const { validateFamilyId } from '../main/tools/validate/validateId';

familyRouter.param('familyId', validateFamilyId, addFamilyIdToLogRequest);

const { attachActiveSubscription } from '../main/tools/validate/validateSubscription';

familyRouter.use('/:familyId', attachActiveSubscription);

// route to dogs (or nested) related things
const { dogsRouter } from './dogs';

familyRouter.use('/:familyId/dogs', dogsRouter);

// route to subscription related things
const { transactionsRouter } from './transactions';

familyRouter.use('/:familyId/subscriptions', transactionsRouter);
familyRouter.use('/:familyId/transactions', transactionsRouter);

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

export { familyRouter };
