import express from 'express';

import {
  getUser, createUser, updateUser, deleteUser,
} from '../../../controllers/controllerRoutes/app/user/user.js';

import { validateUserIdentifier, validateUserId } from '../../../main/tools/validate/validateUserRelatedId.js';

// Route for an alert to send to the suer
import { alertRouter } from './alert.js';

// Route for family (or nested) related things
import { familyRouter } from './family/family.js';

const userRouter = express.Router({ mergeParams: true });

userRouter.use(['/'], validateUserIdentifier, validateUserId);

userRouter.use(['/alert'], alertRouter);

userRouter.use(['/family'], familyRouter);

userRouter.get(['/'], getUser);
userRouter.patch(['/'], getUser);

userRouter.post(['/'], createUser);

userRouter.put(['/'], updateUser);

userRouter.delete(['/'], deleteUser);

export { userRouter };
