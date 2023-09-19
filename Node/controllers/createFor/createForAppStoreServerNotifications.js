const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const {
  formatNumber, formatString,
} = require('../../main/tools/format/formatObject');
const { ValidationError } = require('../../main/tools/general/errors');
const { requestLogger } = require('../../main/tools/logging/loggers');

const { validateNotificationSignedPayload, validateTransactionSignedPayload, validateRenewalInfoSignedPayload } = require('../../main/tools/appStoreConnectAPI/validatePayload');
const { insertAppStoreServerNotification } = require('../../main/tools/appStoreServerNotifications/insertAppStoreServerNotification');

const { findTransactionOwner } = require('../../main/tools/appStoreConnectAPI/findTransactionOwner');
const { getFamilyIdForUserId } = require('../getFor/getForFamily');
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
  // TODO NOW split this function into multiple parts, first part checks if assn is valid and hasnt been logged (then logs it), second part goes into the transaction insertion/update logic
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

  await insertAppStoreServerNotification(databaseConnection, notification, data, renewalInfo, transactionInfo);

  const dataEnvironment = formatString(data.environment, 10);
  const renewalInfoEnvironment = formatString(renewalInfo.environment, 10);
  const transactionInfoEnvironment = formatString(transactionInfo.environment, 10);

  if (dataEnvironment !== global.CONSTANT.SERVER.ENVIRONMENT || renewalInfoEnvironment !== global.CONSTANT.SERVER.ENVIRONMENT || transactionInfoEnvironment !== global.CONSTANT.SERVER.ENVIRONMENT) {
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

  const userId = await findTransactionOwner(
    databaseConnection,
    formatString(transactionInfo.appAccountToken),
    transactionId,
    formatNumber(transactionInfo.originalTransactionId),
  );

  if (areAllDefined(userId) === false) {
    // Unable to locate userId through appAccountToken nor through previous transactions
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
      transactionInfo.offerType,
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

module.exports = {
  createASSNForSignedPayload,
};
