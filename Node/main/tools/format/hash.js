const crypto = require('crypto');
const { formatString } = require('./formatObject');
const { areAllDefined } = require('../validate/validateDefined');

function hash(forString, forSalt) {
  const string = formatString(forString);

  if (areAllDefined(string) === false) {
    return undefined;
  }

  const salt = formatString(forSalt);

  return areAllDefined(salt)
    ? crypto.createHash('sha256').update(string + salt).digest('hex')
    : crypto.createHash('sha256').update(string).digest('hex');
}

module.exports = { hash };
