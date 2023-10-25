import express from 'express';

import { validateSubscription } from '../main/tools/validate/validateSubscription.js';

import {
  getDogs, createDog, updateDog, deleteDog,
} from '../controllers/controllerRoutes/dogs.js';
import { validateDogId } from '../main/tools/validate/validateDogRelatedId.js';

// route to dogs
import { logsRouter } from './logs.js';

// route to reminders
import { remindersRouter } from './reminders.js';

const dogsRouter = express.Router({ mergeParams: true });

// TODO FUTURE depreciate :dogId, last used 3.0.0
dogsRouter.use(['/:dogId/logs', '/:dogId/reminders', '/:dogId', '/'], validateSubscription, validateDogId);

dogsRouter.use(['/:dogId/logs', '/logs'], logsRouter);
dogsRouter.use(['/:dogId/reminders', '/reminders'], remindersRouter);

dogsRouter.get(['/:dogId', '/'], getDogs);
dogsRouter.patch(['/:dogId', '/'], getDogs);

dogsRouter.post(['/'], createDog);

dogsRouter.put(['/:dogId', '/'], updateDog);

dogsRouter.delete(['/:dogId', '/'], deleteDog);

export { dogsRouter };
