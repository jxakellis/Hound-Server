const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../validate/validateDefined');
const {
  formatDate, formatNumber, formatBoolean, formatString,
} = require('../format/formatObject');
const { ValidationError } = require('../general/errors');

/**
 *  Uses the notification, data, renewalInfo, and transactionInfo provided to attempt to locate a corresponding notification in the appStoreServerNotification database.
 *  If a notification is located, then said notification has already been logged and returns
 *  If no notification is located, then inserts the notification into the database
 *  If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
/**
 * Extracts data from parameters provided and attempts to insert a corresponding notification into the appStoreServerNotification table.
 * If a duplicate key is found for notificationUUID, a no-op operation is performed.
 * Throws error is data is missing or databaseQuery fails.
 * @param {*} databaseConnection
 * @param {*} notification
 * @param {*} data
 * @param {*} renewalInfo
 * @param {*} transactionInfo
 */
async function insertAppStoreServerNotification(databaseConnection, notification, data, renewalInfo, transactionInfo) {
  if (areAllDefined(databaseConnection, notification, data, renewalInfo, transactionInfo) === false) {
    throw new ValidationError('databaseConnection, notification, data, renewalInfo, or transactionInfo missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload
  // The in-app purchase event for which the App Store sent this version 2 notification.
  const notificationType = formatString(notification.notificationType, 25);
  // Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.
  const subtype = formatString(notification.subtype, 19);
  // A unique identifier for the notification. Use this value to identify a duplicate notification.
  const notificationUUID = formatString(notification.notificationUUID, 36);
  // A string that indicates the App Store Server Notification version number.
  const version = formatString(notification.version, 3);
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.
  const signedDate = formatDate(formatNumber(notification.signedDate));

  // https://developer.apple.com/documentation/appstoreservernotifications/data
  // The unique identifier of the app that the notification applies to. This property is available for apps that are downloaded from the App Store; it isn’t present in the sandbox environment.
  const dataAppAppleId = formatString(data.appAppleId, 100);
  // The bundle identifier of the app.
  const dataBundleId = formatString(data.bundleId, 19);
  // The version of the build that identifies an iteration of the bundle.
  const dataBundleVersion = formatNumber(data.bundleVersion);
  // The server environment that the notification applies to, either sandbox or production.
  const dataEnvironment = formatString(data.environment, 10);
  // The status of an auto-renewable subscription at the time the App Store signs the notification.
  const dataStatus = formatNumber(data.status);

  // https://developer.apple.com/documentation/appstoreservernotifications/jwsrenewalinfodecodedpayload
  // The product identifier of the product that renews at the next billing period.
  const renewalInfoAutoRenewProductId = formatString(renewalInfo.autoRenewProductId, 60);
  // The renewal status for an auto-renewable subscription.
  const renewalInfoAutoRenewStatus = formatBoolean(renewalInfo.autoRenewStatus);
  // The server environment, either sandbox or production.
  const renewalInfoEnvironment = formatString(renewalInfo.environment, 10);
  // The reason a subscription expired.
  const renewalInfoExpirationIntent = formatNumber(renewalInfo.expirationIntent);
  // The time when the billing grace period for subscription renewals expires.
  const renewalInfoGracePeriodExpiresDate = formatDate(formatNumber(renewalInfo.gracePeriodExpiresDate));
  // The Boolean value that indicates whether the App Store is attempting to automatically renew an expired subscription.
  const renewalInfoIsInBillingRetryPeriod = formatBoolean(renewalInfo.isInBillingRetryPeriod);
  // The offer code or the promotional offer identifier.
  const renewalInfoOfferIdentifier = formatString(renewalInfo.offerIdentifier, 100);
  // The type of subscription offer.
  const renewalInfoOfferType = formatNumber(renewalInfo.offerType);
  // The original transaction identifier of a purchase.
  const renewalInfoOriginalTransactionId = formatNumber(renewalInfo.originalTransactionId);
  // The status that indicates whether the auto-renewable subscription is subject to a price increase.
  const renewalInfoPriceIncreaseStatus = formatBoolean(renewalInfo.priceIncreaseStatus);
  // The product identifier of the in-app purchase.
  const renewalInfoProductId = formatString(renewalInfo.productId, 60);
  // The recent subscription start date is in UNIX time, in milliseconds. The earliest start date of an auto-renewable subscription in a series of subscription purchases that ignores all lapses of paid service that are 60 days or less.
  const renewalInfoRecentSubscriptionStartDate = formatDate(formatNumber(renewalInfo.recentSubscriptionStartDate));
  // The UNIX time, in milliseconds, that the most recent auto-renewable subscription purchase expires.
  const renewalInfoRenewalDate = formatDate(formatNumber(renewalInfo.renewalDate));
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.
  const renewalInfoSignedDate = formatDate(formatNumber(renewalInfo.signedDate));

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  const transactionInfoAppAccountToken = formatString(transactionInfo.appAccountToken, 36);
  // The bundle identifier of the app.
  const transactionInfoBundleId = formatString(transactionInfo.bundleId, 19);
  // The server environment, either sandbox or production.
  const transactionInfoEnvironment = formatString(transactionInfo.environment, 10);
  // The UNIX time, in milliseconds, the subscription expires or renews.
  const transactionInfoExpiresDate = formatDate(formatNumber(transactionInfo.expiresDate));
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const transactionInfoInAppOwnershipType = formatString(transactionInfo.inAppOwnershipType, 13);
  // A Boolean value that indicates whether the user upgraded to another subscription.
  const transactionInfoIsUpgraded = formatBoolean(transactionInfo.isUpgraded);
  // The identifier that contains the promo code or the promotional offer identifier.
  const transactionInfoOfferIdentifier = formatString(transactionInfo.offerIdentifier, 100);
  // A value that represents the promotional offer type.
  const transactionInfoOfferType = formatNumber(transactionInfo.offerType);
  // The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  const transactionInfoOriginalPurchaseDate = formatDate(formatNumber(transactionInfo.originalPurchaseDate));
  // The transaction identifier of the original purchase.
  const transactionInfoOriginalTransactionId = formatNumber(transactionInfo.originalTransactionId);
  // The product identifier of the in-app purchase.
  const transactionInfoProductId = formatString(transactionInfo.productId, 60);
  // The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.
  const transactionInfoPurchaseDate = formatDate(formatNumber(transactionInfo.purchaseDate));
  // The number of consumable products the user purchased.
  const transactionInfoQuantity = formatNumber(transactionInfo.quantity);
  // The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.
  const transactionInfoRevocationDate = formatDate(formatNumber(transactionInfo.revocationDate));
  // The reason that the App Store refunded the transaction or revoked it from Family Sharing.
  const transactionInfoRevocationReason = formatNumber(transactionInfo.revocationReason);
  // The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.
  const transactionInfoSignedDate = formatDate(formatNumber(transactionInfo.signedDate));
  // The identifier of the subscription group the subscription belongs to.
  const transactionInfoSubscriptionGroupIdentifier = formatNumber(transactionInfo.subscriptionGroupIdentifier);
  // The unique identifier of the transaction.
  const transactionInfoTransactionId = formatNumber(transactionInfo.transactionId);
  // The type of the in-app purchase.
  const transactionInfoType = formatString(transactionInfo.type, 27);
  // The unique identifier of subscription purchase events across devices, including subscription renewals.
  const transactionInfoWebOrderLineItemId = formatNumber(transactionInfo.webOrderLineItemId);

  // We attempt to insert the ASSN.
  // If we encounter a duplicate key error, which should only arise if the notificationUUID already exists in the database, we perform a NO-OP update statement to catch and disregard the error.
  await databaseQuery(
    databaseConnection,
    `INSERT INTO appStoreServerNotifications
    (
      notificationType, subtype, notificationUUID, version, signedDate, dataAppAppleId, dataBundleId, 
    dataBundleVersion, dataEnvironment, dataStatus, renewalInfoAutoRenewProductId, renewalInfoAutoRenewStatus, 
    renewalInfoEnvironment, renewalInfoExpirationIntent, renewalInfoGracePeriodExpiresDate, renewalInfoIsInBillingRetryPeriod,
    renewalInfoOfferIdentifier, renewalInfoOfferType, renewalInfoOriginalTransactionId, renewalInfoPriceIncreaseStatus,
    renewalInfoProductId, renewalInfoRecentSubscriptionStartDate, renewalInfoRenewalDate, renewalInfoSignedDate, transactionInfoAppAccountToken,
    transactionInfoBundleId, transactionInfoEnvironment, transactionInfoExpiresDate, transactionInfoInAppOwnershipType,
    transactionInfoIsUpgraded, transactionInfoOfferIdentifier, transactionInfoOfferType, transactionInfoOriginalPurchaseDate,
    transactionInfoOriginalTransactionId, transactionInfoProductId, transactionInfoPurchaseDate, transactionInfoQuantity,
    transactionInfoRevocationDate, transactionInfoRevocationReason, transactionInfoSignedDate, transactionInfoSubscriptionGroupIdentifier,
    transactionInfoTransactionId, transactionInfoType, transactionInfoWebOrderLineItemId
    ) 
    VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?)
    ON DUPLICATE KEY UPDATE notificationUUID=notificationUUID`,
    [
      notificationType, subtype, notificationUUID, version, signedDate, dataAppAppleId, dataBundleId,
      dataBundleVersion, dataEnvironment, dataStatus, renewalInfoAutoRenewProductId, renewalInfoAutoRenewStatus,
      renewalInfoEnvironment, renewalInfoExpirationIntent, renewalInfoGracePeriodExpiresDate, renewalInfoIsInBillingRetryPeriod,
      renewalInfoOfferIdentifier, renewalInfoOfferType, renewalInfoOriginalTransactionId, renewalInfoPriceIncreaseStatus,
      renewalInfoProductId, renewalInfoRecentSubscriptionStartDate, renewalInfoRenewalDate, renewalInfoSignedDate, transactionInfoAppAccountToken,
      transactionInfoBundleId, transactionInfoEnvironment, transactionInfoExpiresDate, transactionInfoInAppOwnershipType,
      transactionInfoIsUpgraded, transactionInfoOfferIdentifier, transactionInfoOfferType, transactionInfoOriginalPurchaseDate,
      transactionInfoOriginalTransactionId, transactionInfoProductId, transactionInfoPurchaseDate, transactionInfoQuantity,
      transactionInfoRevocationDate, transactionInfoRevocationReason, transactionInfoSignedDate, transactionInfoSubscriptionGroupIdentifier,
      transactionInfoTransactionId, transactionInfoType, transactionInfoWebOrderLineItemId,
    ],
  );
}

module.exports = {
  insertAppStoreServerNotification,
};
