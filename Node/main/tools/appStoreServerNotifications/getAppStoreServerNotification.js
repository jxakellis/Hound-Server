const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../validate/validateDefined');
const { ValidationError } = require('../general/errors');

/**
 * Attempts to find the App Store Server Notification associated with the notificationUUID provided
 * @param {*} databaseConnection
 * @param {*} notificationUUID unique identifier for ASSN
 * @returns If found, returns stored ASSN. Otherwise, returns undefined.
 */
async function getAppStoreServerNotification(databaseConnection, notificationUUID) {
  if (areAllDefined(databaseConnection, notificationUUID) === false) {
    throw new ValidationError('databaseConnection or notificationUUID missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const [notification] = await databaseQuery(
    databaseConnection,
    `SELECT
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
    FROM appStoreServerNotifications assn
    WHERE notificationUUID = ? 
    LIMIT 1`,
    [notificationUUID],
  );

  return notification;
}

module.exports = { getAppStoreServerNotification };
