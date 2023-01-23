const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const appStoreServerNotificationsColumns = 'notificationType, \
subtype, \
notificationUUID, \
version, \
signedDate, \
dataAppAppleId, \
dataBundleId, \
dataBundleVersion, \
dataEnvironment, \
renewalInfoAutoRenewProductId, \
renewalInfoAutoRenewStatus, \
renewalInfoExpirationIntent, \
renewalInfoGracePeriodExpiresDate, \
renewalInfoIsInBillingRetryPeriod, \
renewalInfoOfferIdentifier, \
renewalInfoOfferType, \
renewalInfoOriginalTransactionId, \
renewalInfoPriceIncreaseStatus, \
renewalInfoProductId, \
renewalInfoRecentSubscriptionStartDate, \
renewalInfoSignedDate, \
renewalInfoEnvironment, \
transactionInfoAppAccountToken, \
transactionInfoBundleId, \
transactionInfoEnvironment, \
transactionInfoExpiresDate, \
transactionInfoInAppOwnershipType, \
transactionInfoIsUpgraded, \
transactionInfoOfferIdentifier, \
transactionInfoOfferType, \
transactionInfoOriginalPurchaseDate, \
transactionInfoOriginalTransactionId, \
transactionInfoProductId, \
transactionInfoPurchaseDate, \
transactionInfoQuantity, \
transactionInfoRevocationDate, \
transactionInfoRevocationReason, \
transactionInfoSignedDate, \
transactionInfoSubscriptionGroupIdentifier, \
transactionInfoTransactionId, \
transactionInfoType, \
transactionInfoWebOrderLineItemId';

async function getAppStoreServerNotificationForNotificationUUID(databaseConnection, notificationUUID) {
  if (areAllDefined(databaseConnection, notificationUUID) === false) {
    throw new ValidationError('databaseConnection or notificationUUID missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  let notification = await databaseQuery(
    databaseConnection,
    `SELECT ${appStoreServerNotificationsColumns} FROM appStoreServerNotifications WHERE notificationUUID = ? LIMIT 1`,
    [notificationUUID],
  );
  [notification] = notification;

  return notification;
}

module.exports = { getAppStoreServerNotificationForNotificationUUID };
