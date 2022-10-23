const express = require('express');

const { parseFormData, parseJSON } = require('../tools/general/parseBody');
const { logRequest } = require('../tools/logging/logRequest');
const { configureRequestForResponse } = require('../tools/general/configureRequestAndResponse');
const { validateAppVersion } = require('../tools/format/validateId');
const { watchdogRouter } = require('../../routes/watchdog');
const { appStoreServerNotificationsRouter } = require('../../routes/appStoreServerNotifications');
const { userRouter } = require('../../routes/user');
const { GeneralError } = require('../tools/general/errors');

const serverToServerPath = '/appStoreServerNotifications';
const watchdogPath = '/watchdog';
const userPath = '/app/:appVersion';

function configureAppForRequests(app) {
  // Setup defaults and custom res.status method
  app.use(configureRequestForResponse);

  // Parse information possible sent

  app.use(parseFormData);
  app.use(express.urlencoded({ extended: false }));
  app.use(parseJSON);

  // Log request and setup logging for response

  app.use('*', logRequest);

  app.use(watchdogPath, watchdogRouter);

  // Check to see if the request is a server to server communication from Apple
  app.use(serverToServerPath, appStoreServerNotificationsRouter);

  // Make sure the user is on an updated version

  app.use(userPath, validateAppVersion);

  // Route the request to the userRouter

  app.use(`${userPath}/user`, userRouter);

  // Throw back the request if an unknown path is used
  app.use('*', async (req, res) => res.sendResponseForStatusJSONError(404, undefined, new GeneralError('Path not found', global.constant.error.value.INVALID)));
}

module.exports = { configureAppForRequests };
