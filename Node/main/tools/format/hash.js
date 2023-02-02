const crypto = require('crypto');
const { formatString, formatSHA256Hash } = require('./formatObject');
const { areAllDefined } = require('./validateDefined');

function hash(forString, forSalt) {
  console.log(`begin hash ${forString}, ${forSalt}`);
  const string = formatSHA256Hash(forString);
  if (areAllDefined(string) === false) {
    console.log(`fail hash ${forString}, ${forSalt}, ${string}`);
    return undefined;
  }

  const salt = formatString(forSalt);

  console.log(`continue hash ${forString}, ${forSalt}, ${string}, ${salt}`);
  return areAllDefined(salt)
    ? crypto.createHash('sha256').update(string + salt).digest('hex')
    : crypto.createHash('sha256').update(string).digest('hex');
}

module.exports = { hash };
