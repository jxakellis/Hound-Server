import express from 'express';

import { parseFormData, parseJSON } from '../tools/general/parseBody';
import { logRequest, addAppVersionToLogRequest } from '../tools/logging/logRequest';
import { configureRequestAndResponse } from './configureRequestAndResponse';
import { validateAppVersion } from '../tools/validate/validateId';
import { watchdogRouter } from '../../routes/watchdog';
import { appStoreServerNotificationsRouter } from '../../routes/appStoreServerNotifications';
import { userRouter } from '../../routes/user';
import { HoundError, ErrorType } from './globalErrors';
import { ERROR } from './globalConstants';

const serverToServerPath = '/appStoreServerNotifications';
const watchdogPath = '/watchdog';
const userPath = '/app/:appVersion';

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
  app.use('*', async (req: express.Request, res: express.Response) => res.sendResponseForStatusBodyError(404, null, new HoundError('Path not found', ErrorType.General, ERROR.VALUE.INVALID)));
}

export { configureApp };
