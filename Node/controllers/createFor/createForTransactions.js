const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatDate, formatNumber, formatString, formatBoolean,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const { extractTransactionIdFromAppStoreReceiptURL } = require('../../main/tools/appStoreConnectAPI/extractTransactionId');
const { querySubscriptionStatusesFromAppStoreAPI } = require('../../main/tools/appStoreConnectAPI/queryTransactions');
const { getFamilyHeadUserId } = require('../getFor/getForFamily');
const { disableOldTransactionsAutoRenewStatus } = require('../updateFor/updateForTransactions');

// TODO FUTURE depreciate numberOfDogs (last used 3.0.0)

/**
 * 1. Formats the parameters provided
 * 2. Validates the parameters
 * 3. Attempts to insert the transaction
 * 4a. Transaction successfully inserted, returns without issue
 * 4b. Transaction unsuccessfully inserted due to duplicate transactionId, returns without issue (as transaction already exists so no need to insert it)
 * 4c. Transaction unsuccessfully inserted due to non-duplicate key error, throws error
 * @param {*} databaseConnection
 * @param {*} userId
 * @param {*} forEnvironment
 * @param {*} forExpiresDate
 * @param {*} forInAppOwnershipType
 * @param {*} forTransactionId
 * @param {*} forOfferIdentifier
 * @param {*} forOfferType
 * @param {*} forOriginalTransactionId
 * @param {*} forProductId
 * @param {*} forPurchaseDate
 * @param {*} forQuantity
 * @param {*} forSubscriptionGroupIdentifier
 * @param {*} forTransactionReason
 * @param {*} forWebOrderLineItemId
 */
async function createTransactionForTransactionInfo(
  databaseConnection,
  userId,
  forAutoRenewProductId,
  forAutoRenewStatus,
  forEnvironment,
  forExpiresDate,
  forInAppOwnershipType,
  forTransactionId,
  forOfferIdentifier,
  forOfferType,
  forOriginalTransactionId,
  forProductId,
  forPurchaseDate,
  forQuantity,
  forRevocationReason,
  forSubscriptionGroupIdentifier,
  forTransactionReason,
  forWebOrderLineItemId,
) {
  // TODO NOW TEST function w new parameters
  // userId

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // appAccountToken; A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  // The product identifier of the subscription that will renew when the current subscription expires. autoRenewProductId == productId when a subscription is created
  const autoRenewProductId = formatString(forAutoRenewProductId, 60);
  // The renewal status for an auto-renewable subscription.
  const autoRenewStatus = formatBoolean(forAutoRenewStatus);
  // bundleId; The bundle identifier of the app.
  // The server environment, either Sandbox or Production.
  const environment = formatString(forEnvironment, 10);
  // The UNIX time, in milliseconds, the subscription expires or renews.
  const expiresDate = formatDate(formatNumber(forExpiresDate));
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const inAppOwnershipType = formatString(forInAppOwnershipType, 13);
  // isUpgraded; A Boolean value that indicates whether the user upgraded to another subscription.
  // The identifier that contains the offer code or the promotional offer identifier.
  const offerIdentifier = formatString(forOfferIdentifier, 64);
  // A value that represents the promotional offer type. The offer types 2 and 3 have an offerIdentifier.
  const offerType = formatNumber(forOfferType);
  // originalPurchaseDate; The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  // The transaction identifier of the original purchase.
  const originalTransactionId = formatNumber(forOriginalTransactionId);
  // The product identifier of the in-app purchase.
  const productId = formatString(forProductId, 60);
  // The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.
  const purchaseDate = formatDate(formatNumber(forPurchaseDate));
  // The number of consumable products the user purchased.
  const quantity = formatNumber(forQuantity);
  // revocationDate; The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.
  // The reason that the App Store refunded the transaction or revoked it from Family Sharing.
  const revocationReason = formatNumber(forRevocationReason);
  // signedDate; The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.
  // storefront; The three-letter code that represents the country or region associated with the App Store storefront for the purchase.
  // storefrontId; An Apple-defined value that uniquely identifies the App Store storefront associated with the purchase.
  // The identifier of the subscription group the subscription belongs to.
  const subscriptionGroupIdentifier = formatNumber(forSubscriptionGroupIdentifier);
  // The unique identifier of the transaction.
  const transactionId = formatNumber(forTransactionId);
  // The reason for the purchase transaction, which indicates whether it’s a customer’s purchase or a renewal for an auto-renewable subscription that the system initiates.
  const transactionReason = formatString(forTransactionReason, 8);
  // type; The type of the in-app purchase.
  // The unique identifier of subscription purchase events across devices, including subscription renewals.
  const webOrderLineItemId = formatNumber(forWebOrderLineItemId);

  if (areAllDefined(
    databaseConnection,
    userId,
    autoRenewProductId,
    autoRenewStatus,
    environment,
    expiresDate,
    inAppOwnershipType,
    // offerIdentifier is optionally defined
    // offerType is optionally defined
    originalTransactionId,
    productId,
    purchaseDate,
    quantity,
    // revocationReason is optionally defined
    subscriptionGroupIdentifier,
    transactionId,
    transactionReason,
    webOrderLineItemId,
  ) === false) {
    throw new ValidationError(`databaseConnection, userId, 
    autoRenewProductId, autoRenewStatus, environment, expiresDate, inAppOwnershipType, originalTransactionId, 
    productId, purchaseDate, quantity, subscriptionGroupIdentifier, 
    transactionId, transactionReason, or webOrderLineItemId is missing`, global.CONSTANT.ERROR.VALUE.MISSING);
  }

  if (environment !== global.CONSTANT.SERVER.ENVIRONMENT) {
    throw new ValidationError(`environment must be '${global.CONSTANT.SERVER.ENVIRONMENT}', not '${environment}'`, global.CONSTANT.ERROR.VALUE.INVALID);
  }

  if (inAppOwnershipType !== 'PURCHASED') {
    throw new ValidationError(`inAppOwnershipType must be 'PURCHASED', not '${inAppOwnershipType}'`, global.CONSTANT.ERROR.VALUE.INVALID);
  }

  const correspondingProduct = global.CONSTANT.SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === productId);

  if (areAllDefined(correspondingProduct) === false) {
    throw new ValidationError('correspondingProduct missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const { numberOfFamilyMembers, numberOfDogs } = correspondingProduct;

  if (areAllDefined(numberOfFamilyMembers, numberOfDogs) === false) {
    throw new ValidationError('numberOfFamilyMembers or numberOfDogs missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  // We attempt to insert the transaction.
  // If we encounter a duplicate key error, which should only arise if the transactionId already exists in the database, we perform a NO-OP update statement to catch and disregard the error.
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (
      userId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId, autoRenewStatus, environment, expiresDate, inAppOwnershipType,
      offerIdentifier, offerType, originalTransactionId, productId,
      purchaseDate, quantity, revocationReason, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId
    )
    VALUES
    (
      ?,
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 
      ?, ?, ?, ?, ?,
      ?, ?
    )
    ON DUPLICATE KEY UPDATE transactionId=transactionId`,
    [
      userId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId, autoRenewStatus, environment, expiresDate, inAppOwnershipType,
      offerIdentifier, offerType, originalTransactionId, productId,
      purchaseDate, quantity, revocationReason, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId,
    ],
  );

  await disableOldTransactionsAutoRenewStatus(databaseConnection, userId);
}

async function createTransactionForAppStoreReceiptURL(databaseConnection, userId, appStoreReceiptURL) {
  // TODO NOW TEST function with new interior that only gets subscriptions
  if (areAllDefined(databaseConnection, userId, appStoreReceiptURL) === false) {
    throw new ValidationError('databaseConnection, userId, or appStoreReceiptURL missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const transactionId = formatNumber(extractTransactionIdFromAppStoreReceiptURL(appStoreReceiptURL));

  if (areAllDefined(transactionId) === false) {
    throw new ValidationError('transactionId couldn\'t be constructed with extractTransactionIdFromAppStoreReceiptURL', global.CONSTANT.ERROR.VALUE.INVALID);
  }

  const subscriptions = await querySubscriptionStatusesFromAppStoreAPI(transactionId);

  if (areAllDefined(subscriptions) === false) {
    throw new ValidationError('subscriptions couldn\'t be queried with querySubscriptionStatusesFromAppStoreAPI', global.CONSTANT.ERROR.VALUE.INVALID);
  }

  // First, we find the corresponding transaction to our original transactionId
  const targetSubscription = subscriptions.find((subscription) => formatNumber(subscription[1].transactionId) === transactionId);

  if (areAllDefined(targetSubscription) === false) {
    throw new ValidationError(`Couldn't find a targetSubscription for transactionId ${transactionId}`, global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // The create transaction for our target transaction must succeed.
  await createTransactionForTransactionInfo(
    databaseConnection,
    userId,
    targetSubscription[0].autoRenewProductId,
    targetSubscription[0].autoRenewStatus,
    targetSubscription[1].environment,
    targetSubscription[1].expiresDate,
    targetSubscription[1].inAppOwnershipType,
    targetSubscription[1].transactionId,
    targetSubscription[1].offerIdentifier,
    targetSubscription[1].offerType,
    targetSubscription[1].originalTransactionId,
    targetSubscription[1].productId,
    targetSubscription[1].purchaseDate,
    targetSubscription[1].quantity,
    targetSubscription[1].revocationReason,
    targetSubscription[1].subscriptionGroupIdentifier,
    targetSubscription[1].transactionReason,
    targetSubscription[1].webOrderLineItemId,
  );

  // The create transaction for our other transactions should hopefully succeed but can fail
  // Filter out the target transaction from the transactions array
  const nonTargetSubscriptions = subscriptions.filter((subscription) => formatNumber(subscription[1].transactionId) !== transactionId);

  // Create an array of Promises
  const subscriptionPromises = nonTargetSubscriptions.map((nonTargetSubscription) => createTransactionForTransactionInfo(
    databaseConnection,
    userId,
    nonTargetSubscription[0].autoRenewProductId,
    nonTargetSubscription[0].autoRenewStatus,
    nonTargetSubscription[1].environment,
    nonTargetSubscription[1].expiresDate,
    nonTargetSubscription[1].inAppOwnershipType,
    nonTargetSubscription[1].transactionId,
    nonTargetSubscription[1].offerIdentifier,
    nonTargetSubscription[1].offerType,
    nonTargetSubscription[1].originalTransactionId,
    nonTargetSubscription[1].productId,
    nonTargetSubscription[1].purchaseDate,
    nonTargetSubscription[1].quantity,
    nonTargetSubscription[1].revocationReason,
    nonTargetSubscription[1].subscriptionGroupIdentifier,
    nonTargetSubscription[1].transactionReason,
    nonTargetSubscription[1].webOrderLineItemId,
  ).catch((error) => {
    // Log or handle the error here, it won't propagate further
    console.error(`Failed to create transaction for transactionId ${nonTargetSubscription.transactionId}:`, error);
    return null;
  }));

  // Execute all Promises concurrently
  await Promise.allSettled(subscriptionPromises);
}

module.exports = { createTransactionForTransactionInfo, createTransactionForAppStoreReceiptURL };
