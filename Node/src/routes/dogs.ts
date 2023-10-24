import express from 'express';

import { validateSubscription } from '../main/tools/validate/validateSubscription.js';

import {
  getDogs, createDog, updateDog, deleteDog,
} from '../controllers/controllerRoutes/dogs.js';
import { validateDogId } from '../main/tools/validate/validateId.js';

// route to dogs
import { logsRouter } from './logs.js';

// route to reminders
import { remindersRouter } from './reminders.js';

const dogsRouter = express.Router({ mergeParams: true });

dogsRouter.use(validateSubscription);
dogsRouter.use(validateDogId);

dogsRouter.use('/:dogId/logs', logsRouter);

dogsRouter.use('/:dogId/reminders', remindersRouter);

dogsRouter.get(['/:dogId', '/'], getDogs);

dogsRouter.post('/', createDog);

dogsRouter.put('/:dogId', updateDog);

dogsRouter.delete('/:dogId', deleteDog);

export { dogsRouter };
