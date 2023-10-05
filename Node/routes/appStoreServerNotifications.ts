const express = require('express';

const appStoreServerNotificationsRouter = express.Router({ mergeParams: true });

const {
  createAppStoreServerNotification,
} from ''../controllers/controllerRoutes/appStoreServerNotifications';

appStoreServerNotificationsRouter.post('/', createAppStoreServerNotification);

export { appStoreServerNotificationsRouter };
