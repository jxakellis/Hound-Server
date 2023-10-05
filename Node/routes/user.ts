const express = require('express';

const userRouter = express.Router({ mergeParams: true });

const { addUserIdToLogRequest } from '../main/tools/logging/logRequest';

const {
  getUser, createUser, updateUser, deleteUser,
} from ''../controllers/controllerRoutes/user';

const { validateUserId } from '../main/tools/validate/validateId';

// TODO FUTURE we pass userId, userIdentifier, familyId, and appVersion through as headers in >= 3.0.1. Once users updated, depreciate old way of using them as param paths.

userRouter.param('userId', validateUserId);
// If userId is successfully validated, then we add it to the request
userRouter.param('userId', addUserIdToLogRequest);

// Route for an alert to send to the suer
const { alertRouter } from './alert';

userRouter.use('/:userId/alert', alertRouter);

// Route for family (or nested) related things
const { familyRouter } from './family';

userRouter.use('/:userId/family', familyRouter);

// gets user with userIdentifier then return information from users and userConfiguration table
userRouter.get('/', getUser);
userRouter.get('/:userId', getUser);
// no body

// creates user and userConfiguration
userRouter.post('/', createUser);
/* BODY:
Single: { userInfo }
*/

// updates user
userRouter.put('/:userId', updateUser);
/* BODY:
Single: { userInfo }
*/

// deletes a user
userRouter.delete('/:userId', deleteUser);

export { userRouter };
