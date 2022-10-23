/* eslint-disable max-classes-per-file */
const { areAllDefined } = require('../format/validateDefined');

class GeneralError extends Error {
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class DatabaseError extends Error {
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class ParseError extends Error {
  constructor(message, code) {
    super(message);
    this.message = message;
    this.code = code;
    this.name = this.constructor.name;
  }
}

const convertErrorToJSON = (error) => {
  // error isn't defined, so further reference would cause additional, uncaught error
  if (areAllDefined(error) === false) {
    return { message: 'Unknown Message', code: 'Unknown Code', name: 'UnknownError' };
  }

  // constructor isn't defined, so further reference would cause error
  if (areAllDefined(error.constructor) === false) {
    return { message: error.message, code: error.code, name: 'UnknownError' };
  }

  return { message: error.message, code: error.code, name: error.constructor.name };
};

module.exports = {
  GeneralError, DatabaseError, ValidationError, ParseError, convertErrorToJSON,
};
