const axios = require('axios');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const { areAllDefined } = require('./validateDefined');
const { ValidationError, ExternalServerError } = require('../general/errors');
const { logServerError } = require('../logging/logServerError');

// The cache is set to expire every 6 hours, and checks for expired keys every 15 seconds
// If you want to store more items in the cache, you can continue using the same NodeCache instance.
const appleKeysCache = new NodeCache({ stdTTL: 60 * 60 * 6, checkperiod: 15 });
const keyNameForApplePublicKeys = 'applePublicKeys';

// Function to fetch Apple's public keys
async function fetchApplePublicKeys() {
  console.log('fetchApplePublicKeys');
  // Try to get the keys from the cache
  let applePublicKeys = appleKeysCache.get(keyNameForApplePublicKeys);
  console.log('appleKeysCache.get', applePublicKeys);

  // If the keys are not in the cache, fetch them from Apple's server
  if (areAllDefined(applePublicKeys) === false) {
    console.log('going to get from /auth/keys');
    let response;
    try {
      // Fetch Apple’s public key to verify the ID token signature.
      response = await axios.get('https://appleid.apple.com/auth/keys');
    }
    catch (error) {
      console.log('axios error', error);
      logServerError('axios.get(\'https://appleid.apple.com/auth/keys\')', error);
      throw new ExternalServerError('Axios failed to query https://appleid.apple.com/auth/keys. We could not retrieve Apple\'s public keys', global.CONSTANT.ERROR.GENERAL.APPLE_SERVER_FAILED);
    }
    console.log('after axios.get');

    if (areAllDefined(response) === false || areAllDefined(response.data) === false || areAllDefined(response.data.keys) === false) {
      throw new ValidationError('response, response.data, or response.data.keys missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }

    applePublicKeys = response.data.keys;

    // Store the fetched keys in the cache
    appleKeysCache.set(keyNameForApplePublicKeys, applePublicKeys);
  }
  console.log('end fetchApplePublicKeys', applePublicKeys);
  return applePublicKeys;
}

// Function to validate a signed payload using Apple's public keys
async function validateAppleSignedPayload(signedPayload) {
  console.log('validateAppleSignedPayload');
  if (areAllDefined(signedPayload) === false) {
    throw new ValidationError('signedPayload missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // signedPayload has 3 components (header, payload, and signature). Decode the header from Base64 and parse it as JSON.
  const headerJSON = JSON.parse(Buffer.from(signedPayload.split('.')[0], 'base64').toString());
  console.log('headerJSON', headerJSON);
  if (areAllDefined(headerJSON) === false) {
    throw new ValidationError('headerJSON missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Fetch Apple's public keys
  let applePublicKeys = await fetchApplePublicKeys();
  if (areAllDefined(applePublicKeys) === false) {
    throw new ValidationError('applePublicKeys missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Find the key from the fetched keys that matches the key identifier in the header
  let matchingKey = applePublicKeys.find((key) => key.kid === headerJSON.kid);
  console.log('matchingKey', matchingKey, headerJSON.kid);
  // If no matching key is found, potentially the keys changed very recently, so we refetch the keys
  if (areAllDefined(matchingKey) === false) {
    // Delete the currently stored Apple public keys
    appleKeysCache.del(keyNameForApplePublicKeys);
    // Refetch Apple's public keys
    applePublicKeys = await fetchApplePublicKeys();
    if (areAllDefined(applePublicKeys) === false) {
      throw new ValidationError('applePublicKeys missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }
    // Research for matchingKey
    matchingKey = applePublicKeys.find((key) => key.kid === headerJSON.kid);
    console.log('matchingKey', matchingKey, headerJSON.kid);
    if (areAllDefined(matchingKey) === false) {
      // We refreshed the keys and there is still no match, therefore the key simply does not exist.
      throw new ValidationError(`The headerJSON.kid ${headerJSON.kid} does not match any known, updated applePublicKey.kid`, global.CONSTANT.ERROR.VALUE.INVALID);
    }
  }

  let verifiedPayload;
  try {
    // Validate the signed payload using the matching key and return the result
    // jwt.validate will throw an error if the verification fails
    verifiedPayload = await jwt.verify(signedPayload, matchingKey.n, { algorithms: [matchingKey.alg] });
  }
  catch (error) {
    console.log('jwt error', verifiedPayload);
    throw new ValidationError('await jwt.verify(signedPayload, matchingKey.n, { algorithms: [matchingKey.alg] }) failed to verify the signedPayload', global.CONSTANT.ERROR.VALUE.MISSING);
  }
}

module.exports = { validateAppleSignedPayload };
