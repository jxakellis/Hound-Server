import express from 'express';

import {
  getWatchdog,
} from '../controllers/controllerRoutes/watchdog';

const watchdogRouter = express.Router({ mergeParams: true });

watchdogRouter.get('/', getWatchdog);
// no body

export { watchdogRouter };
