const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const {
  formatNumber, formatString,
} = require('../../main/tools/format/formatObject');
const { ValidationError } = require('../../main/tools/general/errors');
const { requestLogger } = require('../../main/tools/logging/loggers');

const { validateSignedPayload } = require('../../main/tools/appStoreConnectAPI/validateSignedPayload');
const { insertAppStoreServerNotification } = require('../../main/tools/appStoreServerNotifications/insertAppStoreServerNotification');

const { getTransactionOwner } = require('../getFor/getForTransactions');

const { createTransactionForTransactionInfo } = require('./createForTransactions');

const { updateSubscriptionAutoRenewal, updateSubscriptionRevocation } = require('../updateFor/updateForTransactions');

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
async function createASSNForSignedPayload(databaseConnection, signedPayload) {
  if (areAllDefined(databaseConnection, signedPayload) === false) {
    throw new ValidationError('databaseConnection or signedPayload missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const [notification, data, renewalInfo, transactionInfo] = await validateSignedPayload(signedPayload);

  if (areAllDefined(notification, data, renewalInfo, transactionInfo) === false) {
    throw new ValidationError('notification, data, renewalInfo, or transactionInfo missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // The in-app purchase event for which the App Store sent this version 2 notification.
  const notificationType = formatString(notification.notificationType, 25);
  // Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.
  const subtype = formatString(notification.subtype, 19);
  // A unique identifier for the notification. Use this value to identify a duplicate notification.
  const notificationUUID = formatString(notification.notificationUUID, 36);

  if (areAllDefined(notificationUUID) === false) {
    throw new ValidationError('notificationUUID missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  requestLogger.debug(`App Store Server Notification ${notificationUUID} of type ${notificationType} with subtype ${subtype} for transaction ${transactionInfo.transactionId}`);

  const didInsertAppStoreServerNotification = await insertAppStoreServerNotification(databaseConnection, notification, data, renewalInfo, transactionInfo);

  // If the ASSN already existed in our database, then the function returns false. This means the ASSN has already been processed and we shouldn't attempt to process it again.
  if (didInsertAppStoreServerNotification === false) {
    return;
  }

  if (formatString(transactionInfo.type) !== 'Auto-Renewable Subscription') {
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

  const userId = await getTransactionOwner(
    databaseConnection,
    formatString(transactionInfo.appAccountToken),
    transactionId,
    formatNumber(transactionInfo.originalTransactionId),
  );

  if (areAllDefined(userId) === false) {
    // Unable to find the userId associated with the transaction.
    // This likely means this is the user's first transaction with Hound and it wasn't done through the app (i.e. through Apple's external offer code or IAP page  )
    return;
  }

  // Check if a new transaction was created, warrenting an insert into the transactions table
  if (notificationType === 'DID_RENEW' || notificationType === 'OFFER_REDEEMED' || notificationType === 'SUBSCRIBED') {
    // DID_RENEW: A notification type that along with its subtype indicates that the subscription successfully renewed.
    // OFFER_REDEEMED: A notification type that along with its subtype indicates that the user redeemed a promotional offer or offer code.
    // SUBSCRIBED: A notification type that along with its subtype indicates that the user subscribed to a product.

    await createTransactionForTransactionInfo(
      databaseConnection,
      userId,
      transactionInfo.environment,
      transactionInfo.expiresDate,
      transactionInfo.inAppOwnershipType,
      transactionInfo.transactionId,
      transactionInfo.offerIdentifier,
      transactionInfo.offerType,
      transactionInfo.originalTransactionId,
      transactionInfo.productId,
      transactionInfo.purchaseDate,
      transactionInfo.quantity,
      transactionInfo.subscriptionGroupIdentifier,
      transactionInfo.transactionReason,
      transactionInfo.webOrderLineItemId,
    );
  }
  // Check if a transaction was invalidated, warrenting an update to the transactions table
  else if (notificationType === 'REFUND' || notificationType === 'REVOKE' || notificationType === 'REFUND_DECLINED' || notificationType === 'REFUND_REVERSED') {
    // REFUND: Indicates that the App Store successfully refunded a transaction for a consumable in-app purchase, a non-consumable in-app purchase, an auto-renewable subscription, or a non-renewing subscription.
    // REVOKE: Indicates that an in-app purchase the user was entitled to through Family Sharing is no longer available through sharing.
    // REFUND_DECLINED: A notification type that indicates the App Store declined a refund request initiated by the app developer using any of the following methods: beginRefundRequest(for:in:), beginRefundRequest(in:), beginRefundRequest(for:in:), beginRefundRequest(in:), and refundRequestSheet(for:isPresented:onDismiss:).
    // REFUND_REVERSED: A notification type that indicates the App Store reversed a previously granted refund due to a dispute that the customer raised. If your app revoked content or services as a result of the related refund, it needs to reinstate them.
    // This notification type can apply to any in-app purchase type: consumable, non-consumable, non-renewing subscription, and auto-renewable subscription. For auto-renewable subscriptions, the renewal date remains unchanged when the App Store reverses a refund.
    await updateSubscriptionRevocation(
      databaseConnection,
      userId,
      transactionInfo.transactionId,
      transactionInfo.revocationReason,
    );
  }
  // Check if a future transaction renewal was changed, warrenting an update to the transactions table
  else if (notificationType === 'DID_CHANGE_RENEWAL_PREF' || notificationType === 'DID_CHANGE_RENEWAL_STATUS' || notificationType === 'DID_FAIL_TO_RENEW' || notificationType === 'EXPIRED') {
    // DID_CHANGE_RENEWAL_PREF: A notification type that along with its subtype indicates that the user made a change to their subscription plan.
    // DID_CHANGE_RENEWAL_STATUS: A notification type that along with its subtype indicates that the user made a change to the subscription renewal status.
    // DID_FAIL_TO_RENEW: A notification type that along with its subtype indicates that the subscription failed to renew due to a billing issue.
    // EXPIRED: A notification type that along with its subtype indicates that a subscription expired.
    await updateSubscriptionAutoRenewal(
      databaseConnection,
      userId,
      transactionInfo.transactionId,
      renewalInfo.autoRenewStatus,
      renewalInfo.autoRenewProductId,
    );
  }
}

module.exports = {
  createASSNForSignedPayload,
};
