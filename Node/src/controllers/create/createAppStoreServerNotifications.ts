import { NotificationType } from 'app-store-server-api';
import {
  type JWSTransactionDecodedPayload, type JWSRenewalInfoDecodedPayload, type DecodedNotificationPayload, type NotificationData,
} from 'app-store-server-api';
import {
  formatDate, formatNumber, formatBoolean, formatKnownString, formatUnknownString,
} from '../../main/format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../main/server/globalErrors.js';
import { requestLogger } from '../../main/logging/loggers.js';

import { validateSignedPayload } from '../../main/tools/appStoreConnectAPI/validateSignedPayload.js';

import { getTransactionOwner } from '../get/getTransactions.js';

import { createUpdateTransaction } from './createTransactions.js';

import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type AppStoreServerNotificationsRow, appStoreServerNotificationsColumns } from '../../main/types/AppStoreServerNotificationsRow.js';
/**
* Extracts data from parameters provided and attempts to insert a corresponding notification into the appStoreServerNotification table.
* If a duplicate key is found for notificationUUID, a no-op operation is performed.
* @param {*} databaseConnection
* @param {*} notification
* @param {*} data
* @param {*} renewalInfo
* @param {*} transactionInfo
* @returns true if an App Store Server Notification was inserted, false if it already existed and wasn't inserted
* @throws If data is missing or databaseQuery fails
*/
async function insertAppStoreServerNotification(
  databaseConnection: Queryable,
  notification: DecodedNotificationPayload,
  data: NotificationData,
  renewalInfo: JWSRenewalInfoDecodedPayload,
  transactionInfo: JWSTransactionDecodedPayload,
): Promise<boolean> {
  // https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload
  // The in-app purchase event for which the App Store sent this version 2 notification.
  const notificationType = formatKnownString(notification.notificationType, 100);
  // Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.
  const subtype = formatUnknownString(notification.subtype, 100);
  // A unique identifier for the notification. Use this value to identify a duplicate notification.
  const { notificationUUID } = notification;
  // A string that indicates the App Store Server Notification version number.
  const version = formatKnownString(notification.version, 3);
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.
  const signedDate = formatDate(formatNumber(notification.signedDate));

  // https://developer.apple.com/documentation/appstoreservernotifications/data
  // The unique identifier of the app that the notification applies to. This property is available for apps that are downloaded from the App Store; it isn’t present in the sandbox environment.
  const dataAppAppleId = formatUnknownString(data.appAppleId, 100);
  // The bundle identifier of the app.
  const dataBundleId = data.bundleId;
  // The version of the build that identifies an iteration of the bundle.
  const dataBundleVersion = data.bundleVersion;
  // The server environment that the notification applies to, either sandbox or production.
  const dataEnvironment = data.environment;
  // The status of an auto-renewable subscription at the time the App Store signs the notification.
  const dataStatus = data.status;

  // https://developer.apple.com/documentation/appstoreservernotifications/jwsrenewalinfodecodedpayload
  // The product identifier of the product that renews at the next billing period.
  const renewalInfoAutoRenewProductId = renewalInfo.autoRenewProductId;
  // The renewal status for an auto-renewable subscription.
  const renewalInfoAutoRenewStatus = formatBoolean(renewalInfo.autoRenewStatus);
  // The server environment, either sandbox or production.
  const renewalInfoEnvironment = renewalInfo.environment;
  // The reason a subscription expired.
  const renewalInfoExpirationIntent = renewalInfo.expirationIntent;
  // The time when the billing grace period for subscription renewals expires.
  const renewalInfoGracePeriodExpiresDate = formatDate(formatNumber(renewalInfo.gracePeriodExpiresDate));
  // The Boolean value that indicates whether the App Store is attempting to automatically renew an expired subscription.
  const renewalInfoIsInBillingRetryPeriod = formatBoolean(renewalInfo.isInBillingRetryPeriod);
  // The offer code or the promotional offer identifier.
  const renewalInfoOfferIdentifier = formatUnknownString(renewalInfo.offerIdentifier, 100);
  // The type of subscription offer.
  const renewalInfoOfferType = renewalInfo.offerType;
  // The original transaction identifier of a purchase.
  const renewalInfoOriginalTransactionId = formatNumber(renewalInfo.originalTransactionId);
  // The status that indicates whether the auto-renewable subscription is subject to a price increase.
  const renewalInfoPriceIncreaseStatus = formatBoolean(renewalInfo.priceIncreaseStatus);
  // The product identifier of the in-app purchase.
  const renewalInfoProductId = renewalInfo.productId;
  // The recent subscription start date is in UNIX time, in milliseconds. The earliest start date of an auto-renewable subscription in a series of subscription purchases that ignores all lapses of paid service that are 60 days or less.
  const renewalInfoRecentSubscriptionStartDate = formatDate(formatNumber(renewalInfo.recentSubscriptionStartDate));
  // The UNIX time, in milliseconds, that the most recent auto-renewable subscription purchase expires.
  const renewalInfoRenewalDate = formatDate(formatNumber(renewalInfo.renewalDate));
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.
  const renewalInfoSignedDate = formatDate(formatNumber(renewalInfo.signedDate));

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  const transactionInfoAppAccountToken = transactionInfo.appAccountToken;
  // The bundle identifier of the app.
  const transactionInfoBundleId = transactionInfo.bundleId;
  // The server environment, either sandbox or production.
  const transactionInfoEnvironment = transactionInfo.environment;
  // The UNIX time, in milliseconds, the subscription expires or renews.
  const transactionInfoExpiresDate = formatDate(formatNumber(transactionInfo.expiresDate));
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const transactionInfoInAppOwnershipType = transactionInfo.inAppOwnershipType;
  // A Boolean value that indicates whether the user upgraded to another subscription.
  const transactionInfoIsUpgraded = formatBoolean(transactionInfo.isUpgraded);
  // The identifier that contains the promo code or the promotional offer identifier.
  const transactionInfoOfferIdentifier = formatUnknownString(transactionInfo.offerIdentifier, 100);
  // A value that represents the promotional offer type.
  const transactionInfoOfferType = transactionInfo.offerType;
  // The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  const transactionInfoOriginalPurchaseDate = formatDate(formatNumber(transactionInfo.originalPurchaseDate));
  // The transaction identifier of the original purchase.
  const transactionInfoOriginalTransactionId = transactionInfo.originalTransactionId;
  // The product identifier of the in-app purchase.
  const transactionInfoProductId = transactionInfo.productId;
  // The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.
  const transactionInfoPurchaseDate = formatDate(formatNumber(transactionInfo.purchaseDate));
  // The number of consumable products the user purchased.
  const transactionInfoQuantity = transactionInfo.quantity;
  // The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.
  const transactionInfoRevocationDate = formatDate(formatNumber(transactionInfo.revocationDate));
  // The reason that the App Store refunded the transaction or revoked it from Family Sharing.
  const transactionInfoRevocationReason = transactionInfo.revocationReason;
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.
  const transactionInfoSignedDate = formatDate(formatNumber(transactionInfo.signedDate));
  // The identifier of the subscription group the subscription belongs to.
  const transactionInfoSubscriptionGroupIdentifier = transactionInfo.subscriptionGroupIdentifier;
  // The unique identifier of the transaction.
  const transactionInfoTransactionId = transactionInfo.transactionId;
  // The type of the in-app purchase.
  const transactionInfoType = transactionInfo.type;
  // The unique identifier of subscription purchase events across devices, including subscription renewals.
  const transactionInfoWebOrderLineItemId = transactionInfo.webOrderLineItemId;

  const result = await databaseQuery<AppStoreServerNotificationsRow[]>(
    databaseConnection,
    `SELECT ${appStoreServerNotificationsColumns}
      FROM appStoreServerNotifications assn
      WHERE notificationUUID = ?
      LIMIT 1`,
    [notificationUUID],
  );

  const existingAppStoreServerNotification = result.safeIndex(0);

  // If the ASSN already exists, we don't want to try and reinsert it, so we ignore it.
  if (existingAppStoreServerNotification !== undefined && existingAppStoreServerNotification !== null) {
    return false;
  }

  // We attempt to insert the ASSN.
  // If we encounter a duplicate key error, which should only arise if the notificationUUID already exists in the database, we perform a NO-OP update statement to catch and disregard the error.
  await databaseQuery(
    databaseConnection,
    `INSERT INTO appStoreServerNotifications
        (
          notificationType, subtype, notificationUUID, version, signedDate,
          dataAppAppleId, dataBundleId, dataBundleVersion, dataEnvironment, dataStatus,
          renewalInfoAutoRenewProductId, renewalInfoAutoRenewStatus, renewalInfoEnvironment, renewalInfoExpirationIntent,
          renewalInfoGracePeriodExpiresDate, renewalInfoIsInBillingRetryPeriod, renewalInfoOfferIdentifier, renewalInfoOfferType,
          renewalInfoOriginalTransactionId, renewalInfoPriceIncreaseStatus, renewalInfoProductId, renewalInfoRecentSubscriptionStartDate,
          renewalInfoRenewalDate, renewalInfoSignedDate,
          transactionInfoAppAccountToken, transactionInfoBundleId, transactionInfoEnvironment, transactionInfoExpiresDate,
          transactionInfoInAppOwnershipType, transactionInfoIsUpgraded, transactionInfoOfferIdentifier, transactionInfoOfferType,
          transactionInfoOriginalPurchaseDate, transactionInfoOriginalTransactionId, transactionInfoProductId, transactionInfoPurchaseDate,
          transactionInfoQuantity, transactionInfoRevocationDate, transactionInfoRevocationReason, transactionInfoSignedDate,
          transactionInfoSubscriptionGroupIdentifier, transactionInfoTransactionId, transactionInfoType, transactionInfoWebOrderLineItemId
          ) 
          VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            )
            ON DUPLICATE KEY UPDATE notificationUUID=notificationUUID`,
    [
      notificationType, subtype, notificationUUID, version, signedDate,
      dataAppAppleId, dataBundleId, dataBundleVersion, dataEnvironment, dataStatus,
      renewalInfoAutoRenewProductId, renewalInfoAutoRenewStatus, renewalInfoEnvironment, renewalInfoExpirationIntent,
      renewalInfoGracePeriodExpiresDate, renewalInfoIsInBillingRetryPeriod, renewalInfoOfferIdentifier, renewalInfoOfferType,
      renewalInfoOriginalTransactionId, renewalInfoPriceIncreaseStatus, renewalInfoProductId, renewalInfoRecentSubscriptionStartDate,
      renewalInfoRenewalDate, renewalInfoSignedDate,
      transactionInfoAppAccountToken, transactionInfoBundleId, transactionInfoEnvironment, transactionInfoExpiresDate,
      transactionInfoInAppOwnershipType, transactionInfoIsUpgraded, transactionInfoOfferIdentifier, transactionInfoOfferType,
      transactionInfoOriginalPurchaseDate, transactionInfoOriginalTransactionId, transactionInfoProductId, transactionInfoPurchaseDate,
      transactionInfoQuantity, transactionInfoRevocationDate, transactionInfoRevocationReason, transactionInfoSignedDate,
      transactionInfoSubscriptionGroupIdentifier, transactionInfoTransactionId, transactionInfoType, transactionInfoWebOrderLineItemId,
    ],
  );

  return true;
}

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
  if (transactionId === undefined || transactionId === null) {
    throw new HoundError('transactionId missing', createASSNForSignedPayload, ERROR_CODES.VALUE.MISSING);
  }

  const userId = await getTransactionOwner(
    databaseConnection,
    transactionInfo.appAccountToken,
    transactionId,
    formatNumber(transactionInfo.originalTransactionId),
  );

  if (userId === undefined || userId === null) {
    // Unable to find the userId associated with the transaction.
    // This likely means this is the user's first transaction with Hound and it wasn't done through the app (i.e. through Apple's external offer code or IAP page  )
    return;
  }

  await createUpdateTransaction(
    databaseConnection,
    userId,
    renewalInfo,
    transactionInfo,
  );
}

export {
  createASSNForSignedPayload,
};
