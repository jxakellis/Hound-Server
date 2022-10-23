const express = require('express');

const dogsRouter = express.Router({ mergeParams: true });

const { validateSubscription } = require('../main/tools/format/validateSubscription');

dogsRouter.use('/', validateSubscription);

const {
  getDogs, createDog, updateDog, deleteDog,
} = require('../controllers/controllerRoutes/dogs');
const { validateDogId } = require('../main/tools/format/validateId');

// validation that params are formatted correctly and have adequate permissions
dogsRouter.param('dogId', validateDogId);

// route to dogs
const { logsRouter } = require('./logs');

dogsRouter.use('/:dogId/logs', logsRouter);

// route to reminders
const { remindersRouter } = require('./reminders');

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

module.exports = { dogsRouter };
