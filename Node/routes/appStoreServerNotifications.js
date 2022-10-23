const express = require('express');

const appStoreServerNotificationsRouter = express.Router({ mergeParams: true });

const {
  createAppStoreServerNotification,
} = require('../controllers/controllerRoutes/appStoreServerNotifications');

appStoreServerNotificationsRouter.post('/', createAppStoreServerNotification);

module.exports = { appStoreServerNotificationsRouter };
