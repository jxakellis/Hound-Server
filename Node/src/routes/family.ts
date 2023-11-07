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

familyRouter.use(['/'], validateFamilyId, attachActiveSubscription);

familyRouter.use(['/dogs'], dogsRouter);

familyRouter.use(['/subscriptions'], transactionsRouter);

familyRouter.use(['/transactions'], transactionsRouter);

familyRouter.get(['/'], getFamily);
familyRouter.patch(['/'], getFamily);

familyRouter.post(['/'], createFamily);

familyRouter.put(['/'], updateFamily);

familyRouter.delete(['/'], deleteFamily);

export { familyRouter };
