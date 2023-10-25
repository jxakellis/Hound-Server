import express from 'express';

import { validateAppVersion } from '../main/tools/validate/validateAppVersion.js';

import { userRouter } from './user.js';

const appRouter = express.Router({ mergeParams: true });

// Make sure the user is on an updated version
appRouter.use(['/:appVersion', '/'], validateAppVersion);

// Route the request to the userRouter
// TODO FUTURE depreciate appVersion paths, last used <= 3.0.0
appRouter.use(['/:appVersion/user', '/user'], userRouter);

export { appRouter };
