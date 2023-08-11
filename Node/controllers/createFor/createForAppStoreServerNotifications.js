const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const {
  formatDate, formatNumber, formatBoolean, formatString,
} = require('../../main/tools/format/formatObject');
const { ValidationError } = require('../../main/tools/general/errors');
const { requestLogger } = require('../../main/tools/logging/loggers');

const { validateNotificationSignedPayload, validateTransactionSignedPayload, validateRenewalInfoSignedPayload } = require('../../main/tools/appStoreConnectAPI/validatePayload');

const { getUserForUserApplicationUsername } = require('../getFor/getForUser');
const { getFamilyIdForUserId } = require('../getFor/getForFamily');
const { getAppStoreServerNotificationForNotificationUUID } = require('../getFor/getForAppStoreServerNotifications');
const { getInAppSubscriptionForTransactionId } = require('../getFor/getForTransactions');

const { insertTransactionForTransactionInfo } = require('../../main/tools/appStoreConnectAPI/insertTransaction');

const { updateSubscriptionAutoRenewal, updateSubscriptionRevocation } = require('../updateFor/updateForInAppSubscriptions');

/*
Processes an App Store Server Notification from start to finish. If anything goes wrong, it logs it as a server error.
1. decodes the payload,
2. checks to see if the notification has been logged before,
3. logs the notification,
4. lhecks to see if the notification is a transaction we can process (e.g. auto renewed subscription),
5. attempts to link the notification to a user account,
6. updates the transaction records to reflect the new/updated information (e.g. insert transaction, change auto-renew flag on existing one, revokes refunded transaction)
*/
async function createASSNForSignedPayload(databaseConnection, signedPayload) {
  if (areAllDefined(databaseConnection, signedPayload) === false) {
    throw new ValidationError('databaseConnection or signedPayload missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const notification = await validateNotificationSignedPayload(signedPayload);

  if (areAllDefined(notification) === false) {
    throw new ValidationError('notification missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // The in-app purchase event for which the App Store sent this version 2 notification.
  const notificationType = formatString(notification.notificationType, 25);
  // Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.
  const subtype = formatString(notification.subtype, 19);
  // A unique identifier for the notification. Use this value to identify a duplicate notification.
  const notificationUUID = formatString(notification.notificationUUID, 36);
  // The object that contains the app metadata and signed renewal and transaction information.
  const { data } = notification;

  if (areAllDefined(notificationUUID, data) === false) {
    throw new ValidationError('notificationUUID or data missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const transactionInfo = await validateTransactionSignedPayload(data.signedTransactionInfo);
  const renewalInfo = await validateRenewalInfoSignedPayload(data.signedRenewalInfo);

  if (areAllDefined(transactionInfo, renewalInfo) === false) {
    throw new ValidationError('transactionInfo or renewalInfo missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  requestLogger.debug(`App Store Server Notification ${notificationUUID} of type ${notificationType} with subtype ${subtype} for transaction ${transactionInfo.transactionId}`);

  const storedNotification = await getAppStoreServerNotificationForNotificationUUID(databaseConnection, notificationUUID);

  // Check if we have logged this notification before
  if (areAllDefined(storedNotification) === true) {
    // Notification has been logged into database, return
    requestLogger.debug('App Store Server Notification has been logged before');
    return;
  }

  requestLogger.debug("App Store Server Notification hasn't been logged before");

  await insertASSNForNotification(databaseConnection, notification, data, renewalInfo, transactionInfo);

  const dataEnvironment = formatString(data.environment, 10);
  const renewalInfoEnvironment = formatString(renewalInfo.environment, 10);
  const transactionInfoEnvironment = formatString(transactionInfo.environment, 10);
  const currentDatabaseEnvironment = global.CONSTANT.SERVER.IS_PRODUCTION_DATABASE ? 'Production' : 'Sandbox';

  if (dataEnvironment !== currentDatabaseEnvironment || renewalInfoEnvironment !== currentDatabaseEnvironment || transactionInfoEnvironment !== currentDatabaseEnvironment) {
    // Always log the App Store Server Notification. However, if the environments don't match, then don't do anything with that information.
    return;
  }

  // Check if the notification type indicates we need to create or update an entry for transactions table
  if (notificationType === 'CONSUMPTION_REQUEST'
  || notificationType === 'GRACE_PERIOD_EXPIRED'
  || notificationType === 'PRICE_INCREASE'
  || notificationType === 'RENEWAL_EXTENDED'
  || notificationType === 'TEST') {
    // CONSUMPTION_REQUEST: Indicates that the customer initiated a refund request for a consumable in-app purchase, and the App Store is requesting that you provide consumption data.
    // GRACE_PERIOD_EXPIRED: Indicates that the billing grace period has ended without renewing the subscription, so you can turn off access to service or content.
    // PRICE_INCREASE: A notification type that along with its subtype indicates that the system has informed the user of an auto-renewable subscription price increase.
    // RENEWAL_EXTENDED: Indicates that the App Store extended the subscription renewal date that the developer requested.
    // TEST: A notification type that the App Store server sends when you request it by calling the Request a Test Notification endpoint.
    return;
  }

  const transactionId = formatNumber(transactionInfo.transactionId);

  // Check to see if the notification provided a transactionId
  if (areAllDefined(transactionId) === false) {
    throw new ValidationError('transactionId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Attempt to find a corresponding userId
  let userId;

  const applicationUsername = transactionInfo.appAccountToken;
  if (areAllDefined(applicationUsername)) {
    const user = await getUserForUserApplicationUsername(databaseConnection, applicationUsername);
    userId = areAllDefined(user) ? user.userId : undefined;
  }

  // Couldn't find user because applicationUsername was undefined or because no user had that applicationUsername
  if (areAllDefined(userId) === false) {
    const originalTransactionId = formatNumber(transactionInfo.originalTransactionId);
    // attempt to find userId with most recent transaction. Use originalTransactionId to link to potential transactions
    const [transaction] = await databaseQuery(
      databaseConnection,
      `SELECT userId
      FROM transactions t
      WHERE transactionId = ? OR originalTransactionId = ?
      ORDER BY purchaseDate DESC
      LIMIT 1`,
      [transactionId, originalTransactionId],
    );
    userId = areAllDefined(transaction) ? transaction.userId : undefined;
  }

  if (areAllDefined(userId) === false) {
    // Unable to locate userId through applicationUsername nor through previous transactions
    throw new ValidationError('userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyId = await getFamilyIdForUserId(databaseConnection, userId);

  // Check if a new transaction was created, warrenting an insert into the transactions table
  if (notificationType === 'DID_RENEW' || notificationType === 'OFFER_REDEEMED' || notificationType === 'SUBSCRIBED') {
    // DID_RENEW: A notification type that along with its subtype indicates that the subscription successfully renewed.
    // OFFER_REDEEMED: A notification type that along with its subtype indicates that the user redeemed a promotional offer or offer code.
    // SUBSCRIBED: A notification type that along with its subtype indicates that the user subscribed to a product.
    // If notification provided a transactionId, then attempt to see if we have a transaction stored for that transactionId
    const storedTransaction = await getInAppSubscriptionForTransactionId(databaseConnection, transactionId);

    // Verify the transaction isn't already in the database
    if (areAllDefined(storedTransaction)) {
      // Currently, the data we store on transactions is the same whether is through a receipt or an app store server notification
      return;
    }

    await insertTransactionForTransactionInfo(
      databaseConnection,
      userId,
      familyId,
      transactionId,
      transactionInfo.originalTransactionId,
      transactionInfo.environment,
      transactionInfo.productId,
      transactionInfo.subscriptionGroupIdentifier,
      transactionInfo.purchaseDate,
      transactionInfo.expiresDate,
      transactionInfo.quantity,
      transactionInfo.webOrderLineItemId,
      transactionInfo.inAppOwnershipType,
      formatNumber(transactionInfo.offerType) === 1,
      transactionInfo.offerIdentifier,
    );
  }
  // Check if a transaction was invalidated, warrenting an update to the transactions table
  else if (notificationType === 'REFUND' || notificationType === 'REVOKE' || notificationType === 'REFUND_DECLINED' || notificationType === 'REFUND_REVERSED') {
    // REFUND: Indicates that the App Store successfully refunded a transaction for a consumable in-app purchase, a non-consumable in-app purchase, an auto-renewable subscription, or a non-renewing subscription.
    // REVOKE: Indicates that an in-app purchase the user was entitled to through Family Sharing is no longer available through sharing.
    // REFUND_DECLINED: A notification type that indicates the App Store declined a refund request initiated by the app developer using any of the following methods: beginRefundRequest(for:in:), beginRefundRequest(in:), beginRefundRequest(for:in:), beginRefundRequest(in:), and refundRequestSheet(for:isPresented:onDismiss:).
    // REFUND_REVERSED: A notification type that indicates the App Store reversed a previously granted refund due to a dispute that the customer raised. If your app revoked content or services as a result of the related refund, it needs to reinstate them.
    // This notification type can apply to any in-app purchase type: consumable, non-consumable, non-renewing subscription, and auto-renewable subscription. For auto-renewable subscriptions, the renewal date remains unchanged when the App Store reverses a refund.
    await updateSubscriptionRevocation(databaseConnection, transactionId, userId, familyId, transactionInfo.revocationReason);
  }
  // Check if a future transaction renewal was changed, warrenting an update to the transactions table
  else if (notificationType === 'DID_CHANGE_RENEWAL_PREF' || notificationType === 'DID_CHANGE_RENEWAL_STATUS' || notificationType === 'DID_FAIL_TO_RENEW' || notificationType === 'EXPIRED') {
    // DID_CHANGE_RENEWAL_PREF: A notification type that along with its subtype indicates that the user made a change to their subscription plan.
    // DID_CHANGE_RENEWAL_STATUS: A notification type that along with its subtype indicates that the user made a change to the subscription renewal status.
    // DID_FAIL_TO_RENEW: A notification type that along with its subtype indicates that the subscription failed to renew due to a billing issue.
    // EXPIRED: A notification type that along with its subtype indicates that a subscription expired.
    await updateSubscriptionAutoRenewal(databaseConnection, transactionId, userId, familyId, renewalInfo.autoRenewStatus, renewalInfo.autoRenewProductId);
  }
}

/**
 *  Uses the notification, data, renewalInfo, and transactionInfo provided to attempt to locate a corresponding notification in the appStoreServerNotification database.
 *  If a notification is located, then said notification has already been logged and returns
 *  If no notification is located, then inserts the notification into the database
 *  If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function insertASSNForNotification(databaseConnection, notification, data, renewalInfo, transactionInfo) {
  if (areAllDefined(databaseConnection, notification, data, renewalInfo, transactionInfo) === false) {
    throw new ValidationError('databaseConnection or notification missing', global.CONSTANT.ERROR.VALUE.MISSING);
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

  await databaseQuery(
    databaseConnection,
    `INSERT INTO appStoreServerNotifications
    (
      notificationType, subtype, notificationUUID, version, signedDate, dataAppAppleId, dataBundleId, 
    dataBundleVersion, dataEnvironment, dataStatus, renewalInfoAutoRenewProductId, renewalInfoAutoRenewStatus, 
    renewalInfoEnvironment, renewalInfoExpirationIntent, renewalInfoGracePeriodExpiresDate, renewalInfoIsInBillingRetryPeriod,
    renewalInfoOfferIdentifier, renewalInfoOfferType, renewalInfoOriginalTransactionId, renewalInfoPriceIncreaseStatus,
    renewalInfoProductId, renewalInfoRecentSubscriptionStartDate, renewalInfoSignedDate, transactionInfoAppAccountToken,
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
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?)`,
    [
      notificationType, subtype, notificationUUID, version, signedDate, dataAppAppleId, dataBundleId,
      dataBundleVersion, dataEnvironment, dataStatus, renewalInfoAutoRenewProductId, renewalInfoAutoRenewStatus,
      renewalInfoEnvironment, renewalInfoExpirationIntent, renewalInfoGracePeriodExpiresDate, renewalInfoIsInBillingRetryPeriod,
      renewalInfoOfferIdentifier, renewalInfoOfferType, renewalInfoOriginalTransactionId, renewalInfoPriceIncreaseStatus,
      renewalInfoProductId, renewalInfoRecentSubscriptionStartDate, renewalInfoSignedDate, transactionInfoAppAccountToken,
      transactionInfoBundleId, transactionInfoEnvironment, transactionInfoExpiresDate, transactionInfoInAppOwnershipType,
      transactionInfoIsUpgraded, transactionInfoOfferIdentifier, transactionInfoOfferType, transactionInfoOriginalPurchaseDate,
      transactionInfoOriginalTransactionId, transactionInfoProductId, transactionInfoPurchaseDate, transactionInfoQuantity,
      transactionInfoRevocationDate, transactionInfoRevocationReason, transactionInfoSignedDate, transactionInfoSubscriptionGroupIdentifier,
      transactionInfoTransactionId, transactionInfoType, transactionInfoWebOrderLineItemId,
    ],
  );
}

module.exports = {
  createASSNForSignedPayload,
};
