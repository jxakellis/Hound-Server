import express from 'express';
import bodyParser from 'body-parser';

import { logRequest, addAppVersionToLogRequest } from '../logging/logRequest.js';
import { logServerError } from '../logging/logServerError.js';
import { configureRequestAndResponse } from './configureRequestAndResponse.js';
import { validateAppVersion } from '../tools/validate/validateId.js';
import { watchdogRouter } from '../../routes/watchdog.js';
import { appStoreServerNotificationsRouter } from '../../routes/appStoreServerNotifications.js';
import { userRouter } from '../../routes/user.js';
import { HoundError, ERROR_CODES } from './globalErrors.js';

const serverToServerPath = '/appStoreServerNotifications';
const watchdogPath = '/watchdog';
const userPath = '/app/:appVersion';

function parseFormData(req: express.Request, res: express.Response, next: express.NextFunction): void {
  bodyParser.urlencoded({
    extended: true,
    limit: '4mb',
  })(req, res, (error) => {
    if (error !== undefined) {
      const houndError = new HoundError('Unable to parse form data', parseFormData, ERROR_CODES.GENERAL.PARSE_FORM_DATA_FAILED, error);
      logServerError(houndError);
      return res.houndDeclarationExtendedProperties.sendFailureResponse(houndError);
    }

    return next();
  });
}

function parseJSON(req: express.Request, res: express.Response, next: express.NextFunction): void {
  bodyParser.json({
    limit: '4mb',
  })(req, res, (error) => {
    if (error !== undefined) {
      const houndError = new HoundError('Unable to parse json', parseJSON, ERROR_CODES.GENERAL.PARSE_JSON_FAILED, error);
      logServerError(houndError);
      return res.houndDeclarationExtendedProperties.sendFailureResponse(houndError);
    }

    return next();
  });
}

function configureApp(app: express.Application): void {
  // Setup defaults and custom res.status method
  app.use(configureRequestAndResponse);

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

  app.use(userPath, addAppVersionToLogRequest, validateAppVersion);

  // Route the request to the userRouter

  app.use(`${userPath}/user`, userRouter);

  // Throw back the request if an unknown path is used
  app.use(
    '*',
    async (req: express.Request, res: express.Response) => (res.houndDeclarationExtendedProperties.sendFailureResponse(
      new HoundError('Path not found', app.use, ERROR_CODES.VALUE.INVALID),
    )),
  );
}

export { configureApp };
