import express from 'express';
import bodyParser from 'body-parser';
const { ValidationError } from './errors';
const { areAllDefined } from '../validate/validateDefined';
const { logServerError } from '../logging/logServerError';

function parseFormData(req: express.Request, res: express.Response, next: NextFunction) {
  bodyParser.urlencoded({
    extended: true,
    limit: '4mb',
  })(req: express.Request, res: express.Response, (error) => {
    if (areAllDefined(error)) {
      logServerError('parseFormData', error);
      return res.sendResponseForStatusBodyError(400, null, new ValidationError('Unable to parse form data', global.CONSTANT.ERROR.GENERAL.PARSE_FORM_DATA_FAILED));
    }
    return next();
  });
}

function parseJSON(req: express.Request, res: express.Response, next: NextFunction) {
  bodyParser.json({
    limit: '4mb',
  })(req: express.Request, res: express.Response, (error) => {
    if (areAllDefined(error)) {
      logServerError('parseJSON', error);
      return res.sendResponseForStatusBodyError(400, null, new ValidationError('Unable to parse json', global.CONSTANT.ERROR.GENERAL.PARSE_JSON_FAILED));
    }

    return next();
  });
}

export { parseFormData, parseJSON };
