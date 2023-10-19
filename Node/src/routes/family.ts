import express from 'express';

import { addFamilyIdToLogRequest } from '../main/logging/logRequest';

import {
  getFamily, createFamily, updateFamily, deleteFamily,
} from '../controllers/controllerRoutes/family';

import { validateFamilyId } from '../main/tools/validate/validateId';

import { attachActiveSubscription } from '../main/tools/validate/validateSubscription';

// route to dogs (or nested) related things
import { dogsRouter } from './dogs';

// route to subscription related things
import { transactionsRouter } from './transactions';

const familyRouter = express.Router({ mergeParams: true });

familyRouter.param('familyId', validateFamilyId);
familyRouter.param('familyId', addFamilyIdToLogRequest);

familyRouter.use('/:familyId', attachActiveSubscription);

familyRouter.use('/:familyId/dogs', dogsRouter);

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
