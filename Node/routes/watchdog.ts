const express = require('express';

const watchdogRouter = express.Router({ mergeParams: true });

const {
  getWatchdog,
} = require('../controllers/controllerRoutes/watchdog';

watchdogRouter.get('/', getWatchdog);
// no body

export { watchdogRouter };
