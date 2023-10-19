import express from 'express';

import {
  createAppStoreServerNotification,
} from '../controllers/controllerRoutes/appStoreServerNotifications';

const appStoreServerNotificationsRouter = express.Router({ mergeParams: true });

appStoreServerNotificationsRouter.post('/', createAppStoreServerNotification);

export { appStoreServerNotificationsRouter };
