const bodyParser = require('body-parser');
const { ValidationError } = require('./errors');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');

function parseFormData(req, res, next) {
  bodyParser.urlencoded({
    extended: true,
    limit: '4mb',
  })(req, res, (error) => {
    if (areAllDefined(error)) {
      logServerError('parseFormData', error);
      return res.sendResponseForStatusBodyError(400, undefined, new ValidationError('Unable to parse form data', global.CONSTANT.ERROR.GENERAL.APP_VERSION_OUTDATED));
    }
    return next();
  });
}

function parseJSON(req, res, next) {
  bodyParser.json({
    limit: '4mb',
  })(req, res, (error) => {
    if (areAllDefined(error)) {
      logServerError('parseJSON', error);
      return res.sendResponseForStatusBodyError(400, undefined, new ValidationError('Unable to parse json', global.CONSTANT.ERROR.GENERAL.PARSE_JSON_FAILED));
    }

    return next();
  });
}

module.exports = { parseFormData, parseJSON };
