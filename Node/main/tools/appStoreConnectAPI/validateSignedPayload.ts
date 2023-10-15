import {
  decodeNotificationPayload, decodeTransaction, decodeRenewalInfo,
  DecodedNotificationPayload, NotificationData, JWSTransactionDecodedPayload, JWSRenewalInfoDecodedPayload,
} from 'app-store-server-api';
import { HoundError, ERROR_CODES } from '../../server/globalErrors';
import { logServerError } from '../../logging/logServerError';
import { formatUnknownString } from '../../format/formatObject';
import { SERVER } from '../../server/globalConstants';

/// Takes a signedPayload from an App Store Server Notificatio. Returns payload if successfully decoded, otherwise returns null.
async function validateNotificationSignedPayload(signedPayload: string): Promise<DecodedNotificationPayload | undefined> {
  let payload: DecodedNotificationPayload;
  try {
    payload = await decodeNotificationPayload(signedPayload);
  }
  catch (error) {
    logServerError('validateNotificationSignedPayload', error);
    return undefined;
  }

  if (formatUnknownString(payload.data.bundleId) !== SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedTransactionInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns null.
async function validateTransactionSignedPayload(signedTransactionInfo: string): Promise<JWSTransactionDecodedPayload | undefined> {
  let payload: JWSTransactionDecodedPayload;
  try {
    payload = await decodeTransaction(signedTransactionInfo);
  }
  catch (error) {
    logServerError('validateTransactionSignedPayload', error);
    return undefined;
  }

  if (payload.bundleId !== SERVER.APP_BUNDLE_ID) {
    return undefined;
  }

  return payload;
}

/// Takes a signedRenewalInfo from the payload of an App Store Server Notification. Returns payload if successfully decoded, otherwise returns null.
async function validateRenewalInfoSignedPayload(signedRenewalInfo: string): Promise<JWSRenewalInfoDecodedPayload | undefined> {
  let payload: JWSRenewalInfoDecodedPayload;
  try {
    payload = await decodeRenewalInfo(signedRenewalInfo);
  }
  catch (error) {
    logServerError('validateRenewalInfoSignedPayload', error);
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

  if (notification === null || notification === undefined) {
    throw new HoundError('notification missing', 'validateSignedPayload', ERROR_CODES.VALUE.MISSING);
  }

  // The object that contains the app metadata and signed renewal and transaction information.
  const { data } = notification;

  const transactionInfo = await validateTransactionSignedPayload(data.signedTransactionInfo);
  const renewalInfo = await validateRenewalInfoSignedPayload(data.signedRenewalInfo);

  if (transactionInfo === undefined) {
    throw new HoundError('transactionInfo missing', 'validateSignedPayload', ERROR_CODES.VALUE.MISSING);
  }
  if (renewalInfo === undefined) {
    throw new HoundError('renewalInfo missing', 'validateSignedPayload', ERROR_CODES.VALUE.MISSING);
  }

  if (data.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(
      `data.environment must be '${SERVER.ENVIRONMENT}', not '${data.environment}'`,
      'validateSignedPayload',
      ERROR_CODES.VALUE.INVALID,
    );
  }

  if (renewalInfo.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(
      `renewalInfo.environment must be '${SERVER.ENVIRONMENT}', not '${renewalInfo.environment}'`,
      'validateSignedPayload',
      ERROR_CODES.VALUE.INVALID,
    );
  }

  if (transactionInfo.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(
      `transactionInfo.environment must be '${SERVER.ENVIRONMENT}', not '${transactionInfo.environment}'`,
      'validateSignedPayload',
      ERROR_CODES.VALUE.INVALID,
    );
  }

  return {
    notification, data, renewalInfo, transactionInfo,
  };
}

export {
  validateSignedPayload,
};
