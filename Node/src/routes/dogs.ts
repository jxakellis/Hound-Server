import express from 'express';

import { validateSubscription } from '../main/tools/validate/validateSubscription.js';

import {
  getDogs, createDog, updateDog, deleteDog,
} from '../controllers/controllerRoutes/dogs.js';
import { validateDogUUID } from '../main/tools/validate/validateDogRelatedId.js';

import { logsRouter } from './logs.js';
import { remindersRouter } from './reminders.js';
import { triggersRouter } from './triggers.js';

const dogsRouter = express.Router({ mergeParams: true });

dogsRouter.use(['/'], validateSubscription, validateDogUUID);

dogsRouter.use(['/logs'], logsRouter);
dogsRouter.use(['/reminders'], remindersRouter);
dogsRouter.use(['/dogTriggers'], triggersRouter);

dogsRouter.get(['/'], getDogs);
dogsRouter.patch(['/'], getDogs);

dogsRouter.post(['/'], createDog);

dogsRouter.put(['/'], updateDog);

dogsRouter.delete(['/'], deleteDog);

export { dogsRouter };
