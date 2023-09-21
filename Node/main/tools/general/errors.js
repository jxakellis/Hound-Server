/* eslint-disable max-classes-per-file */
const { areAllDefined } = require('../validate/validateDefined');
const { formatString } = require('../format/formatObject');

class GeneralError extends Error {
  constructor(message, code) {
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    const formattedMessage = formatString(message).replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ');
    super(formattedMessage);
    this.message = formattedMessage;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class DatabaseError extends Error {
  constructor(message, code) {
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    const formattedMessage = formatString(message).replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ');
    super(formattedMessage);
    this.message = formattedMessage;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class ValidationError extends Error {
  constructor(message, code) {
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    const formattedMessage = formatString(message).replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ');
    super(formattedMessage);
    this.message = formattedMessage;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class ExternalServerError extends Error {
  constructor(message, code) {
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    const formattedMessage = formatString(message).replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ');
    super(formattedMessage);
    this.message = formattedMessage;
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
  GeneralError, DatabaseError, ValidationError, ExternalServerError, convertErrorToJSON,
};
