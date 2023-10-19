import express from 'express';

import { validateSubscription } from '../main/tools/validate/validateSubscription';

import {
  getDogs, createDog, updateDog, deleteDog,
} from '../controllers/controllerRoutes/dogs';
import { validateDogId } from '../main/tools/validate/validateId';

// route to dogs
import { logsRouter } from './logs';

// route to reminders
import { remindersRouter } from './reminders';

const dogsRouter = express.Router({ mergeParams: true });

dogsRouter.use('/', validateSubscription);

// validation that params are formatted correctly and have adequate permissions
dogsRouter.param('dogId', validateDogId);

dogsRouter.use('/:dogId/logs', logsRouter);

dogsRouter.use('/:dogId/reminders', remindersRouter);

// gets all dogs, query parameter of ?all attaches the logs and the reminders to the dog
dogsRouter.get('/', getDogs);
// no body

// gets specific dog, query parameter of ?all attaches the logs and the reminders to the dogs
dogsRouter.get('/:dogId', getDogs);
// no body

// creates dog
dogsRouter.post('/', createDog);
/* BODY:
Single: { dogInfo }
*/

// updates dog
dogsRouter.put('/:dogId', updateDog);
/* BODY:
Single: { dogInfo }
*/

// deletes dog
dogsRouter.delete('/:dogId', deleteDog);
// no body

export { dogsRouter };
