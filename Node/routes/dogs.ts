const express = require('express';

const dogsRouter = express.Router({ mergeParams: true });

const { validateSubscription } from '../main/tools/validate/validateSubscription';

dogsRouter.use('/', validateSubscription);

const {
  getDogs, createDog, updateDog, deleteDog,
} from ''../controllers/controllerRoutes/dogs';
const { validateDogId } from '../main/tools/validate/validateId';

// validation that params are formatted correctly and have adequate permissions
dogsRouter.param('dogId', validateDogId);

// route to dogs
const { logsRouter } from './logs';

dogsRouter.use('/:dogId/logs', logsRouter);

// route to reminders
const { remindersRouter } from './reminders';

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
