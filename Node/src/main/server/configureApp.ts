import express from 'express';
import bodyParser from 'body-parser';

import { logRequest } from '../logging/logRequest.js';
import { configureRequestAndResponse } from './configureRequestAndResponse.js';
import { watchdogRouter } from '../../routes/watchdog.js';
import { appStoreServerNotificationsRouter } from '../../routes/appStoreServerNotifications.js';
import { affiliateTransactionsRouter } from '../../routes/affiliateTransactions.js';
import { HoundError, ERROR_CODES } from './globalErrors.js';
import { appRouter } from '../../routes/app/app.js';

function parseFormData(req: express.Request, res: express.Response, next: express.NextFunction): void {
  bodyParser.urlencoded({
    extended: true,
    limit: '4mb',
  })(req, res, (error) => {
    if (error !== undefined && error !== null) {
      const houndError = new HoundError('Unable to parse form data', parseFormData, ERROR_CODES.GENERAL.PARSE_FORM_DATA_FAILED, error);
      return res.houndProperties.sendFailureResponse(houndError);
    }

    return next();
  });
}

function parseJSON(req: express.Request, res: express.Response, next: express.NextFunction): void {
  bodyParser.json({
    limit: '4mb',
  })(req, res, (error) => {
    if (error !== undefined && error !== null) {
      const houndError = new HoundError('Unable to parse json', parseJSON, ERROR_CODES.GENERAL.PARSE_JSON_FAILED, error);
      return res.houndProperties.sendFailureResponse(houndError);
    }

    return next();
  });
}

function configureApp(app: express.Application): void {
  // Setup houndProperties
  app.use(configureRequestAndResponse);

  // Parse data
  app.use(parseFormData);
  app.use(express.urlencoded({ extended: false }));
  app.use(parseJSON);

  // Log request
  app.use(logRequest);

  // Match path
  app.use('/watchdog', watchdogRouter);
  app.use('/appStoreServerNotifications', appStoreServerNotificationsRouter);
  app.use('/affiliateTransactions', affiliateTransactionsRouter);
  app.use('/app', appRouter);

  // Throw back the request if an unknown path is used
  app.use(
    '*',
    async (req: express.Request, res: express.Response) => (res.houndProperties.sendFailureResponse(
      new HoundError('Path not found', app.use, ERROR_CODES.VALUE.INVALID),
    )),
  );
}

export { configureApp };
