import express from 'express';
import bodyParser from 'body-parser';
import { HoundError, ErrorType } from '../../server/globalErrors';
import { logServerError } from '../logging/logServerError';
import { ERROR } from '../../server/globalConstants';

function parseFormData(req: express.Request, res: express.Response, next: express.NextFunction): void {
  bodyParser.urlencoded({
    extended: true,
    limit: '4mb',
  })(req, res, (error) => {
    if (error !== undefined) {
      logServerError('parseFormData', error);
      return res.sendResponseForStatusBodyError(400, null, new HoundError('Unable to parse form data', ErrorType.Validation, ERROR.GENERAL.PARSE_FORM_DATA_FAILED));
    }
    return next();
  });
}

function parseJSON(req: express.Request, res: express.Response, next: express.NextFunction): void {
  bodyParser.json({
    limit: '4mb',
  })(req, res, (error) => {
    if (error !== undefined) {
      logServerError('parseJSON', error);
      return res.sendResponseForStatusBodyError(400, null, new HoundError('Unable to parse json', ErrorType.Validation, ERROR.GENERAL.PARSE_JSON_FAILED));
    }

    return next();
  });
}

export { parseFormData, parseJSON };
