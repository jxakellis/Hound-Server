import { NotificationType } from 'app-store-server-api';
import {
  formatNumber,
} from '../../main/format/formatObject';
import { HoundError, ERROR_CODES } from '../../main/server/globalErrors';
import { requestLogger } from '../../main/logging/loggers';

import { validateSignedPayload } from '../../main/tools/appStoreConnectAPI/validateSignedPayload';
import { insertAppStoreServerNotification } from '../../main/tools/appStoreServerNotifications/insertAppStoreServerNotification';

import { getTransactionOwner } from '../getFor/getForTransactions';

import { createUpdateTransaction } from './createForTransactions';

import { Queryable } from '../../main/types/Queryable';

/**
* Processes an App Store Server Notification
* 1. Decodes the payload
* 2. Logs the ASSN (if already logged then prematurely returns)
* 3. Checks to see if the ASSN is a transaction we can process (e.g. SUBSCRIBED and not CONSUMPTION_REQUEST)
* 4. Attempts to link the notification to a user account (if can't link then prematurely returns)
* 5. Inserts or updates transaction records to reflect the information (e.g. insert transaction, change autoRenewStatus flag...)
* @param {*} databaseConnection
* @param {*} signedPayload
*/
async function createASSNForSignedPayload(databaseConnection: Queryable, signedPayload: string): Promise<void> {
  const {
    notification, data, renewalInfo, transactionInfo,
  } = await validateSignedPayload(signedPayload);

  // The in-app purchase event for which the App Store sent this version 2 notification.
  const { notificationType } = notification;
  // Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.
  const { subtype } = notification;
  // A unique identifier for the notification. Use this value to identify a duplicate notification.
  const { notificationUUID } = notification;

  requestLogger.debug(`App Store Server Notification ${notificationUUID} of type ${notificationType} with subtype ${subtype} for transaction ${transactionInfo.transactionId}`);

  const didInsertAppStoreServerNotification = await insertAppStoreServerNotification(databaseConnection, notification, data, renewalInfo, transactionInfo);

  // If the ASSN already existed in our database, then the function returns false. This means the ASSN has already been processed and we shouldn't attempt to process it again.
  if (didInsertAppStoreServerNotification === false) {
    return;
  }

  if (transactionInfo.type !== 'Auto-Renewable Subscription') {
    return;
  }

  // New notificationTypes could be added
  switch (notificationType) {
    case NotificationType.DidRenew:
    case NotificationType.OfferRedeemed:
    case NotificationType.Subscribed:
    case NotificationType.Refund:
    case NotificationType.Revoke:
    case NotificationType.RefundDeclined:
    case NotificationType.RefundReversed:
    case NotificationType.DidChangeRenewalPref:
    case NotificationType.DidChangeRenewalStatus:
    case NotificationType.DidFailToRenew:
    case NotificationType.Expired:
    // These are the NotificationType that we recognize and can process further. If not one of these types, then terminate early
    // DID_RENEW: A notification type that along with its subtype indicates that the subscription successfully renewed.
    // OFFER_REDEEMED: A notification type that along with its subtype indicates that the user redeemed a promotional offer or offer code.
    // SUBSCRIBED: A notification type that along with its subtype indicates that the user subscribed to a product.
    // REFUND: Indicates that the App Store successfully refunded a transaction for a consumable in-app purchase, a non-consumable in-app purchase, an auto-renewable subscription, or a non-renewing subscription.
    // REVOKE: Indicates that an in-app purchase the user was entitled to through Family Sharing is no longer available through sharing.
    // REFUND_DECLINED: A notification type that indicates the App Store declined a refund request initiated by the app developer using any of the following methods: beginRefundRequest(for:in:), beginRefundRequest(in:), beginRefundRequest(for:in:), beginRefundRequest(in:), and refundRequestSheet(for:isPresented:onDismiss:).
    // REFUND_REVERSED: A notification type that indicates the App Store reversed a previously granted refund due to a dispute that the customer raised. If your app revoked content or services as a result of the related refund, it needs to reinstate them.
    // DID_CHANGE_RENEWAL_PREF: A notification type that along with its subtype indicates that the user made a change to their subscription plan.
    // DID_CHANGE_RENEWAL_STATUS: A notification type that along with its subtype indicates that the user made a change to the subscription renewal status.
    // DID_FAIL_TO_RENEW: A notification type that along with its subtype indicates that the subscription failed to renew due to a billing issue.
    // EXPIRED: A notification type that along with its subtype indicates that a subscription expired.
      break;
    default:
      // RENEWAL_EXTENDED: A notification type that indicates the App Store extended the subscription renewal date for a specific subscription. You request subscription-renewal-date extensions by calling Extend a Subscription Renewal Date or Extend Subscription Renewal Dates for All Active Subscribers in the App Store Server API.
      // RENEWAL_EXTENSION: A notification type that, along with its subtype, indicates that the App Store is attempting to extend the subscription renewal date that you request by calling Extend Subscription Renewal Dates for All Active Subscribers.
      // CONSUMPTION_REQUEST: Indicates that the customer initiated a refund request for a consumable in-app purchase, and the App Store is requesting that you provide consumption data.
      // GRACE_PERIOD_EXPIRED: Indicates that the billing grace period has ended without renewing the subscription, so you can turn off access to service or content.
      // PRICE_INCREASE: A notification type that along with its subtype indicates that the system has informed the user of an auto-renewable subscription price increase.
      // RENEWAL_EXTENDED: Indicates that the App Store extended the subscription renewal date that the developer requested.
      // TEST: A notification type that the App Store server sends when you request it by calling the Request a Test Notification endpoint.
      return;
  }

  const transactionId = formatNumber(transactionInfo.transactionId);

  // Check to see if the notification provided a transactionId
  if (transactionId === undefined) {
    throw new HoundError('transactionId missing', 'createASSNForSignedPayload', ERROR_CODES.VALUE.MISSING);
  }

  const userId = await getTransactionOwner(
    databaseConnection,
    transactionInfo.appAccountToken,
    transactionId,
    formatNumber(transactionInfo.originalTransactionId),
  );

  if (userId === undefined) {
    // Unable to find the userId associated with the transaction.
    // This likely means this is the user's first transaction with Hound and it wasn't done through the app (i.e. through Apple's external offer code or IAP page  )
    return;
  }

  await createUpdateTransaction(
    databaseConnection,
    userId,
    {
      ...renewalInfo,
      ...transactionInfo,
    }
  );
}

export {
  createASSNForSignedPayload,
};
