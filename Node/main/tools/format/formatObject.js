const { areAllDefined } = require('../validate/validateDefined');

// RFC 5322 compliant regex statement from http://emailregex.com/
// eslint-disable-next-line max-len, no-control-regex
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

// maximum email length of 320/319 is incorrect, format with brackets <long@email.address>
const maximumEmailLengthWithAngleBrackets = 256;
// maximum email length of 320/319 is incorrect, format without brackets long@email.address
const maximumEmailLengthWithoutAngleBrackets = 254;
// all internet emails should be in the foo@bar.com format (ignoring intranet format), shortest possible email is therefore x@y.zz (6 characters)
const minimumEmailLength = 6;

const minimumUsernameLength = 1;
const maximumUsernameLength = 64;

/**
 * If the string provided passes the regex and length checks, returns true.
 * Otherwise, function returns false.
 */
function formatEmail(string) {
  let userEmail = formatString(string, maximumEmailLengthWithAngleBrackets);

  if (areAllDefined(userEmail) === false) {
    return null;
  }

  userEmail = userEmail.replace('mailto:', '');
  userEmail = userEmail.replace('<', '');
  userEmail = userEmail.replace('>', '');

  if (userEmail.length < minimumEmailLength || userEmail.length > maximumEmailLengthWithoutAngleBrackets) {
    return null;
  }

  const isValid = emailRegex.test(userEmail);
  if (isValid === false) {
    return null;
  }

  // Further checking of some things regex can't handle
  const emailParts = userEmail.split('@');

  const username = emailParts[0];
  if (username.length < minimumUsernameLength || username.length > maximumUsernameLength) {
    return null;
  }

  // requirements for length of the components to domain are vague
  // const domain = emailParts[1];

  return userEmail.toLowerCase();
}

/**
 * Converts provided date into format needed for database. If any check fails, returns null. Otherwise, returns correctly formatted date.
 */
function formatDate(forDate) {
  // check if parameter is defined
  if (areAllDefined(forDate) === false) {
    return null;
  }
  // parameter is a string, try to convert into a date
  if (typeof forDate === 'string' || typeof forDate === 'number') {
    const date = new Date(forDate);
    // if not a date object or the date object is an invalid date (e.g. Date('nonDateFoo')), then we return null
    if (Object.prototype.toString.call(date) !== '[object Date]' || Number.isNaN(date) === true) {
      return null;
    }
    try {
      date.toISOString().slice(0, 19).replace('T', ' ');
      // date in correct format
      return date;
    }
    catch (error) {
      // unable to convert format; incorrect format
      return null;
    }
  }
  // if the date parameter is a date object and its date is valid (not 'Invalid Date'), then return
  else if (Object.prototype.toString.call(forDate) === '[object Date]' && Number.isNaN(forDate) === false) {
    return forDate;
  }
  // unrecognized type, return null
  else {
    return null;
  }
}

/**
 * Converts the provided string into a boolean. "true", "1", or 1 retuns true; "false", "0", or 0 returns false; all other values return null
 * This is needed as Boolean("string") always converts to true unless the string provided is ""
 */
function formatBoolean(boolean) {
  if (areAllDefined(boolean) === false) {
    return null;
  }
  if (typeof boolean === 'boolean') {
    // already a boolean object
    return boolean;
  }

  switch (boolean) {
    case 'true':
    case 1:
    case '1':
    case 'yes':
      return true;
    case 'false':
    case 0:
    case '0':
    case 'no':
      return false;
    default:
      return null;
  }
}

/**
 * Converts the provided string into a number.
 * Any finite number will successfully convert into a number.
 * This is needed as Number("foo") converts into NaN with type of number.
 * This result circumvents the typeof bar === 'null' logic as its type is number even though its value is null/NaN/null.
*/
function formatNumber(forNumber) {
  if (areAllDefined(forNumber) === false) {
    return null;
  }
  // forcible convert into a number. If it can't convert, then NaN is typically resolved
  const number = Number(forNumber);

  /**
> Number.isFinite(1);
true
> Number.isFinite(1.0);
true
> Number.isFinite('foo');
false
> Number.isFinite(NaN);
false
> Number.isFinite(Infinity);
false
> Number.isFinite(null);
false
> Number.isFinite(null);
false
   */

  // if potentialNumber isn't finite, then we don't want it as a number.
  if (Number.isFinite(number) === false) {
    return null;
  }
  // potential number was cast and is finite, so its a number we can use
  return number;
}

function formatArray(array) {
  if (areAllDefined(array) === false) {
    return null;
  }
  if (Array.isArray(array) === false) {
    return null;
  }
  return array;
}

function formatSHA256Hash(forString) {
  let string = formatString(forString, null);
  if (areAllDefined(string) === false) {
    return null;
  }

  // OUTPUT IS CASE INSENSITIVE
  string = string.toLowerCase();

  const regex = /^[A-Fa-f0-9]{64}$/g;
  const isValid = regex.test(string);
  if (isValid === false) {
    return null;
  }
  return string;
}

function formatBase64EncodedString(forString) {
  const string = formatString(forString, null);

  if (areAllDefined(string) === false) {
    return null;
  }

  // OUTPUT IS CASE SENSITIVE
  const regex = /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/;
  const isValid = regex.test(string);
  if (isValid === false) {
    return null;
  }
  return string;
}

function formatString(string, length) {
  if (areAllDefined(string) === false) {
    return null;
  }

  if (typeof string !== 'string') {
    return null;
  }

  if (areAllDefined(length) === false) {
    return string;
  }

  return string.substring(0, length);
}

module.exports = {
  formatEmail, formatDate, formatBoolean, formatNumber, formatArray, formatSHA256Hash, formatBase64EncodedString, formatString,
};
