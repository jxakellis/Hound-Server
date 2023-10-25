import express from 'express';

import {
  getUser, createUser, updateUser, deleteUser,
} from '../controllers/controllerRoutes/user.js';

import { validateUserIdentifier, validateUserId } from '../main/tools/validate/validateUserRelatedId.js';

// Route for an alert to send to the suer
import { alertRouter } from './alert.js';

// Route for family (or nested) related things
import { familyRouter } from './family.js';

const userRouter = express.Router({ mergeParams: true });

// TODO FUTURE depreciate userId paths, last used <= 3.0.0

userRouter.use(['/:userId/alert', '/:userId/family', '/:userId', '/'], validateUserIdentifier, validateUserId);

userRouter.use(['/:userId/alert', '/alert'], alertRouter);

userRouter.use(['/:userId/family', '/family'], familyRouter);

userRouter.get(['/:userId', '/'], getUser);
userRouter.patch(['/:userId', '/'], getUser);

userRouter.post(['/'], createUser);

userRouter.put(['/:userId', '/'], updateUser);

userRouter.delete(['/:userId', '/'], deleteUser);

export { userRouter };
