import express from 'express';

import {
  getFamily, createFamily, updateFamily, deleteFamily,
} from '../controllers/controllerRoutes/family.js';

import { validateFamilyId } from '../main/tools/validate/validateUserRelatedId.js';

import { attachActiveSubscription } from '../main/tools/validate/validateSubscription.js';

// route to dogs (or nested) related things
import { dogsRouter } from './dogs.js';

// route to subscription related things
import { transactionsRouter } from './transactions.js';

const familyRouter = express.Router({ mergeParams: true });

// TODO FUTURE depreciate :familyId, last used 3.0.0
familyRouter.use(validateFamilyId);
familyRouter.use(attachActiveSubscription);

familyRouter.use(['/:familyId/dogs', '/dogs'], dogsRouter);

familyRouter.use(['/:familyId/subscriptions', '/subscriptions'], transactionsRouter);

familyRouter.use(['/:familyId/transactions', '/transactions'], transactionsRouter);

familyRouter.get(['/:familyId', '/'], getFamily);

familyRouter.post('/', createFamily);

familyRouter.put(['/:familyId', '/'], updateFamily);

familyRouter.delete(['/:familyId', '/'], deleteFamily);

export { familyRouter };
