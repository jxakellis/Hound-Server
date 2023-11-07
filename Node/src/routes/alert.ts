import express from 'express';

import {
  createTerminateAlert,
} from '../controllers/controllerRoutes/alert.js';

const alertRouter = express.Router({ mergeParams: true });

alertRouter.post(['/'], createTerminateAlert);

export { alertRouter };
