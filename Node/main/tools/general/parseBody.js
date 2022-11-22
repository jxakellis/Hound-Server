const bodyParser = require('body-parser');
const { ParseError } = require('./errors');
const { areAllDefined } = require('../format/validateDefined');
const { logServerError } = require('../logging/logServerError');

function parseFormData(req, res, next) {
  bodyParser.urlencoded({
    extended: true,
    limit: '4mb',
  })(req, res, (error) => {
    if (areAllDefined(error)) {
      logServerError('parseFormData', error);
      return res.sendResponseForStatusJSONError(400, undefined, new ParseError('Unable to parse form data', global.CONSTANT.ERROR.GENERAL.APP_VERSION_OUTDATED));
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
      return res.sendResponseForStatusJSONError(400, undefined, new ParseError('Unable to parse json', global.CONSTANT.ERROR.GENERAL.PARSE_JSON_FAILED));
    }

    return next();
  });
}

module.exports = { parseFormData, parseJSON };
