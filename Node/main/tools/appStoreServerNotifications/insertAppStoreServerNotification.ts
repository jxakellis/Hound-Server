import {
  JWSTransactionDecodedPayload, JWSRenewalInfoDecodedPayload, DecodedNotificationPayload, NotificationData,
} from 'app-store-server-api';
import { Queryable, databaseQuery } from '../../database/databaseQuery';
import {
  formatDate, formatNumber, formatBoolean,
} from '../../format/formatObject';
import { AppStoreServerNotificationsRow, prefixAppStoreServerNotificationsColumns } from '../../types/AppStoreServerNotificationsRow';

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
  const { notificationType } = notification;
  // Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.
  const { subtype } = notification;
  // A unique identifier for the notification. Use this value to identify a duplicate notification.
  const { notificationUUID } = notification;
  // A string that indicates the App Store Server Notification version number.
  const { version } = notification;
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.
  const signedDate = formatDate(notification.signedDate);

  // https://developer.apple.com/documentation/appstoreservernotifications/data
  // The unique identifier of the app that the notification applies to. This property is available for apps that are downloaded from the App Store; it isn’t present in the sandbox environment.
  const dataAppAppleId = data.appAppleId;
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
  const renewalInfoOfferIdentifier = renewalInfo.offerIdentifier;
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
  const transactionInfoExpiresDate = formatDate(transactionInfo.expiresDate);
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const transactionInfoInAppOwnershipType = transactionInfo.inAppOwnershipType;
  // A Boolean value that indicates whether the user upgraded to another subscription.
  const transactionInfoIsUpgraded = formatBoolean(transactionInfo.isUpgraded);
  // The identifier that contains the promo code or the promotional offer identifier.
  const transactionInfoOfferIdentifier = transactionInfo.offerIdentifier;
  // A value that represents the promotional offer type.
  const transactionInfoOfferType = transactionInfo.offerType;
  // The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  const transactionInfoOriginalPurchaseDate = formatDate(transactionInfo.originalPurchaseDate);
  // The transaction identifier of the original purchase.
  const transactionInfoOriginalTransactionId = transactionInfo.originalTransactionId;
  // The product identifier of the in-app purchase.
  const transactionInfoProductId = transactionInfo.productId;
  // The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.
  const transactionInfoPurchaseDate = formatDate(transactionInfo.purchaseDate);
  // The number of consumable products the user purchased.
  const transactionInfoQuantity = transactionInfo.quantity;
  // The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.
  const transactionInfoRevocationDate = formatDate(transactionInfo.revocationDate);
  // The reason that the App Store refunded the transaction or revoked it from Family Sharing.
  const transactionInfoRevocationReason = transactionInfo.revocationReason;
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.
  const transactionInfoSignedDate = formatDate(transactionInfo.signedDate);
  // The identifier of the subscription group the subscription belongs to.
  const transactionInfoSubscriptionGroupIdentifier = transactionInfo.subscriptionGroupIdentifier;
  // The unique identifier of the transaction.
  const transactionInfoTransactionId = transactionInfo.transactionId;
  // The type of the in-app purchase.
  const transactionInfoType = transactionInfo.type;
  // The unique identifier of subscription purchase events across devices, including subscription renewals.
  const transactionInfoWebOrderLineItemId = transactionInfo.webOrderLineItemId;

  const existingAppStoreServerNotification = (await databaseQuery<AppStoreServerNotificationsRow[]>(
    databaseConnection,
    `SELECT ${prefixAppStoreServerNotificationsColumns}
    FROM appStoreServerNotifications assn
    WHERE notificationUUID = ?
    LIMIT 1`,
    [notificationUUID],
  )).safeIndex(0);

  // If the ASSN already exists, we don't want to try and reinsert it, so we ignore it.
  if (existingAppStoreServerNotification === undefined) {
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

export {
  insertAppStoreServerNotification,
};
