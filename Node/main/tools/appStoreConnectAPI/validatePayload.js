const { decodeNotificationPayload, decodeTransaction, decodeRenewalInfo } = require('app-store-server-api');
const { areAllDefined } = require('../validate/validateDefined');
const { formatString } = require('../format/formatObject');

/// Takes a signedPayload from an App Store Server Notificatio. Returns payload if successfully decoded, otherwise returns undefined.
async function validateNotificationSignedPayload(signedPayload) {
  console.log('validateNotificationSignedPayload');
  if (areAllDefined(signedPayload) === false) {
    return undefined;
  }

  let payload;
  try {
    payload = await decodeNotificationPayload(signedPayload);
  }
  catch (error) {
    console.log(error);
    return undefined;
  }

  if (areAllDefined(payload) === false) {
    return undefined;
  }

  console.log(payload);

  if (formatString(payload.data.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedTransactionInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateTransactionSignedPayload(signedTransactionInfo) {
  console.log('validateTransactionSignedPayload');
  if (areAllDefined(signedTransactionInfo) === false) {
    return undefined;
  }

  let payload;
  try {
    payload = await decodeTransaction(signedTransactionInfo);
  }
  catch (error) {
    console.log(error);
    return undefined;
  }

  if (areAllDefined(payload) === false) {
    return undefined;
  }

  console.log(payload);

  if (formatString(payload.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedRenewalInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateRenewalInfoSignedPayload(signedRenewalInfo) {
  console.log('validateTransactionSignedPayload');
  if (areAllDefined(signedRenewalInfo) === false) {
    return undefined;
  }

  let payload;
  try {
    payload = await decodeRenewalInfo(signedRenewalInfo);
  }
  catch (error) {
    console.log(error);
    return undefined;
  }

  if (areAllDefined(payload) === false) {
    return undefined;
  }

  // renewalInfo has no bundleId
  console.log(payload);

  return payload;
}

module.exports = {
  validateNotificationSignedPayload, validateTransactionSignedPayload, validateRenewalInfoSignedPayload,
};
