import express from 'express';

import { validateAppVersion } from '../../main/tools/validate/validateAppVersion.js';

import { userRouter } from './user/user.js';
import { globalTypesRouter } from './user/globalTypes.js';

const appRouter = express.Router({ mergeParams: true });

// Make sure the user is on an updated version
appRouter.use(['/'], validateAppVersion);

// Route the request to the userRouter
appRouter.use(['/user'], userRouter);

appRouter.use(['/globalTypes'], globalTypesRouter);

export { appRouter };
