import express from 'express';

import { addUserIdToLogRequest } from '../main/logging/logRequest.js';

import {
  getUser, createUser, updateUser, deleteUser,
} from '../controllers/controllerRoutes/user.js';

import { validateUserIdentifier, validateUserId } from '../main/tools/validate/validateId.js';

// Route for an alert to send to the suer
import { alertRouter } from './alert.js';

// Route for family (or nested) related things
import { familyRouter } from './family.js';

const userRouter = express.Router({ mergeParams: true });

// TODO FUTURE we pass userId, userIdentifier, familyId, and appVersion through as headers in >= 3.0.1. Once users updated, depreciate old way of using them as param paths.

userRouter.use(validateUserIdentifier);
userRouter.param('userId', validateUserId);
userRouter.param('userId', addUserIdToLogRequest);

userRouter.use('/:userId/alert', alertRouter);

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
