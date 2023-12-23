import {
  decodeNotificationPayload, decodeTransaction, decodeRenewalInfo,
  type DecodedNotificationPayload, type NotificationData, type JWSTransactionDecodedPayload, type JWSRenewalInfoDecodedPayload,
} from 'app-store-server-api';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';
import { logServerError } from '../../logging/logServerError.js';
import { formatUnknownString } from '../../format/formatObject.js';
import { SERVER } from '../../server/globalConstants.js';

/// Takes a signedPayload from an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateNotificationSignedPayload(signedPayload: string): Promise<DecodedNotificationPayload | undefined> {
  let payload: DecodedNotificationPayload;
  try {
    payload = await decodeNotificationPayload(signedPayload);
  }
  catch (error) {
    logServerError(
      new HoundError(
        'error from decodeNotificationPayload',
        validateNotificationSignedPayload,
        undefined,
        error,
      ),
    );
    return undefined;
  }

  if (formatUnknownString(payload.data.bundleId) !== SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedTransactionInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateTransactionSignedPayload(signedTransactionInfo: string): Promise<JWSTransactionDecodedPayload | undefined> {
  let payload: JWSTransactionDecodedPayload;
  try {
    payload = await decodeTransaction(signedTransactionInfo);
  }
  catch (error) {
    logServerError(
      new HoundError(
        'error from decodeTransactions',
        validateTransactionSignedPayload,
        undefined,
        error,
      ),
    );
    return undefined;
  }

  if (payload.bundleId !== SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedRenewalInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns undefined.
async function validateRenewalInfoSignedPayload(signedRenewalInfo: string): Promise<JWSRenewalInfoDecodedPayload | undefined> {
  let payload: JWSRenewalInfoDecodedPayload;
  try {
    payload = await decodeRenewalInfo(signedRenewalInfo);
  }
  catch (error) {
    logServerError(
      new HoundError(
        'error from decodeRenewalInfo',
        validateRenewalInfoSignedPayload,
        undefined,
        error,
      ),
    );
    return undefined;
  }

  // renewalInfo has no bundleId

  return payload;
}

/**
* @param {*} signedPayload signedPayload from an App Store Server Notification.
* @returns Extracted and validated components from signedPayload
* @throws If validation fails due to invalid payload or values
*/
async function validateSignedPayload(signedPayload: string): Promise<{
  notification: DecodedNotificationPayload;
  data: NotificationData;
  renewalInfo: JWSRenewalInfoDecodedPayload;
  transactionInfo: JWSTransactionDecodedPayload;
}> {
  const notification = await validateNotificationSignedPayload(signedPayload);

  if (notification === undefined || notification === null) {
    throw new HoundError('notification missing', validateSignedPayload, ERROR_CODES.VALUE.MISSING);
  }

  // The object that contains the app metadata and signed renewal and transaction information.
  const { data } = notification;

  const transactionInfo = await validateTransactionSignedPayload(data.signedTransactionInfo);
  const renewalInfo = await validateRenewalInfoSignedPayload(data.signedRenewalInfo);

  if (transactionInfo === undefined || transactionInfo === null) {
    throw new HoundError('transactionInfo missing', validateSignedPayload, ERROR_CODES.VALUE.MISSING);
  }
  if (renewalInfo === undefined || renewalInfo === null) {
    throw new HoundError('renewalInfo missing', validateSignedPayload, ERROR_CODES.VALUE.MISSING);
  }

  /*
  Allow transactions from other environments. We just mark their origin in the database. This allows App Store connect to test the production version of the app with sandbox transactions

  if (data.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(
      `data.environment must be '${SERVER.ENVIRONMENT}', not '${data.environment}'`,
      validateSignedPayload,
      ERROR_CODES.VALUE.INVALID,
    );
  }

  if (renewalInfo.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(
      `renewalInfo.environment must be '${SERVER.ENVIRONMENT}', not '${renewalInfo.environment}'`,
      validateSignedPayload,
      ERROR_CODES.VALUE.INVALID,
    );
  }

  if (transactionInfo.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(
      `transactionInfo.environment must be '${SERVER.ENVIRONMENT}', not '${transactionInfo.environment}'`,
      validateSignedPayload,
      ERROR_CODES.VALUE.INVALID,
    );
  }
  */

  return {
    notification, data, renewalInfo, transactionInfo,
  };
}

export {
  validateSignedPayload,
};
