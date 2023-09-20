const { decodeNotificationPayload, decodeTransaction, decodeRenewalInfo } = require('app-store-server-api');
const { ValidationError } = require('../general/errors');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');
const { formatString } = require('../format/formatObject');

/**
 * @param {*} signedPayload signedPayload from an App Store Server Notification.
 * @returns Extracted and validated components from signedPayload
 * @throws If validation fails due to invalid payload or values
 */
async function validateSignedPayload(signedPayload) {
  if (areAllDefined(signedPayload) === false) {
    throw new ValidationError('signedPayload missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const notification = await validateNotificationSignedPayload(signedPayload);

  if (areAllDefined(notification) === false) {
    throw new ValidationError('notification missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // The object that contains the app metadata and signed renewal and transaction information.
  const { data } = notification;

  if (areAllDefined(data) === false) {
    throw new ValidationError('data missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const transactionInfo = await validateTransactionSignedPayload(data.signedTransactionInfo);
  const renewalInfo = await validateRenewalInfoSignedPayload(data.signedRenewalInfo);

  if (areAllDefined(transactionInfo, renewalInfo) === false) {
    throw new ValidationError('transactionInfo or renewalInfo missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const dataEnvironment = formatString(data.environment, 10);
  const renewalInfoEnvironment = formatString(renewalInfo.environment, 10);
  const transactionInfoEnvironment = formatString(transactionInfo.environment, 10);

  if (dataEnvironment !== global.CONSTANT.SERVER.ENVIRONMENT || renewalInfoEnvironment !== global.CONSTANT.SERVER.ENVIRONMENT || transactionInfoEnvironment !== global.CONSTANT.SERVER.ENVIRONMENT) {
    throw new ValidationError(
      `environment must be '${global.CONSTANT.SERVER.ENVIRONMENT}', not '${dataEnvironment} ${renewalInfoEnvironment} ${transactionInfoEnvironment}'`,
      global.CONSTANT.ERROR.VALUE.INVALID,
    );
  }

  return [notification, data, renewalInfo, transactionInfo];
}

/// Takes a signedPayload from an App Store Server Notificatio. Returns payload if successfully decoded, otherwise returns undefined.
async function validateNotificationSignedPayload(signedPayload) {
  if (areAllDefined(signedPayload) === false) {
    return undefined;
  }

  let payload;
  try {
    payload = await decodeNotificationPayload(signedPayload);
  }
  catch (error) {
    logServerError('validateNotificationSignedPayload', error);
    return undefined;
  }

  if (areAllDefined(payload) === false) {
    return undefined;
  }

  if (formatString(payload.data.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedTransactionInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateTransactionSignedPayload(signedTransactionInfo) {
  if (areAllDefined(signedTransactionInfo) === false) {
    return undefined;
  }

  let payload;
  try {
    payload = await decodeTransaction(signedTransactionInfo);
  }
  catch (error) {
    logServerError('validateTransactionSignedPayload', error);
    return undefined;
  }

  if (areAllDefined(payload) === false) {
    return undefined;
  }

  if (formatString(payload.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedRenewalInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateRenewalInfoSignedPayload(signedRenewalInfo) {
  if (areAllDefined(signedRenewalInfo) === false) {
    return undefined;
  }

  let payload;
  try {
    payload = await decodeRenewalInfo(signedRenewalInfo);
  }
  catch (error) {
    logServerError('validateRenewalInfoSignedPayload', error);
    return undefined;
  }

  if (areAllDefined(payload) === false) {
    return undefined;
  }

  // renewalInfo has no bundleId

  return payload;
}

module.exports = {
  validateSignedPayload,
};
