const crypto = require('crypto');
const { formatString, formatSHA256Hash } = require('./formatObject');
const { areAllDefined } = require('./validateDefined');

function hash(forString, forSalt) {
  const string = formatSHA256Hash(forString);
  const salt = formatString(forSalt);

  if (areAllDefined(string, salt) === false) {
    return undefined;
  }
  const hashHex = crypto.createHash('sha256').update(string + salt).digest('hex');
  return hashHex;
}

module.exports = { hash };
