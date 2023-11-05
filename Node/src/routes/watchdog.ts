import express from 'express';

import {
  getWatchdog,
} from '../controllers/controllerRoutes/watchdog.js';

const watchdogRouter = express.Router({ mergeParams: true });

watchdogRouter.get(['/'], getWatchdog);
watchdogRouter.patch(['/'], getWatchdog);

export { watchdogRouter };
