const crypto = require('crypto');
const { formatString, formatSHA256Hash } = require('./formatObject');
const { areAllDefined } = require('./validateDefined');

function hash(forString, forSalt) {
  const string = formatSHA256Hash(forString);
  if (areAllDefined(string) === false) {
    return undefined;
  }

  const salt = formatString(forSalt);

  return areAllDefined(salt)
    ? crypto.createHash('sha256').update(string + salt).digest('hex')
    : crypto.createHash('sha256').update(string).digest('hex');
}

module.exports = { hash };
