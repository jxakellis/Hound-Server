const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatDate, formatNumber, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const { extractTransactionIdFromAppStoreReceiptURL } = require('../../main/tools/appStoreConnectAPI/extractTransactionId');
const { queryTransactionsFromAppStoreServerAPI } = require('../../main/tools/appStoreConnectAPI/queryTransactions');
const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

// TODO FUTURE migrate from expirationDate to expiresDate

/**
 * 1. Formats the parameters provided
 * 2. Validates the parameters
 * 3. Attempts to insert the transaction
 * 4a. Transaction successfully inserted, returns without issue
 * 4b. Transaction unsuccessfully inserted due to duplicate transactionId, returns without issue (as transaction already exists so no need to insert it)
 * 4c. Transaction unsuccessfully inserted due to non-duplicate key error, throws error
 * @param {*} databaseConnection
 * @param {*} userId
 * @param {*} familyId
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
  familyId,
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
  forSubscriptionGroupIdentifier,
  forTransactionReason,
  forWebOrderLineItemId,
) {
  console.log('createTransactionForTransactionInfo');
  // TODO NOW TEST this function
  // TODO NOW TEST that the offer code is recieve from both server and reciept
  console.log(`createTransactionForTransactionInfo did recieve ${forOfferIdentifier}`);
  // userId
  // familyId

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // appAccountToken; A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  // The product identifier of the subscription that will renew when the current subscription expires. autoRenewProductId == productId when a subscription is created
  const autoRenewProductId = formatString(forProductId, 60);
  // bundleId; The bundle identifier of the app.
  // The server environment, either Sandbox or Production.
  const environment = formatString(forEnvironment, 10);
  // The UNIX time, in milliseconds, the subscription expires or renews.
  const expiresDate = formatDate(formatNumber(forExpiresDate));
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const inAppOwnershipType = formatString(forInAppOwnershipType, 13);
  // isAutoRenewing; NOT INCLUDED AT THIS STAGE
  // isRevoked; NOT INCLUDED AT THIS STAGE
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
  // revocationReason; The reason that the App Store refunded the transaction or revoked it from Family Sharing.
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
    familyId,
    autoRenewProductId,
    environment,
    expiresDate,
    inAppOwnershipType,
    // offerIdentifier is optionally defined
    // offerType is optionally defined
    originalTransactionId,
    productId,
    purchaseDate,
    quantity,
    subscriptionGroupIdentifier,
    transactionId,
    transactionReason,
    webOrderLineItemId,
  ) === false) {
    throw new ValidationError(`databaseConnection, userId, familyId, 
    autoRenewProductId, environment, expiresDate, inAppOwnershipType, originalTransactionId, 
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

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  // We attempt to insert the transaction.
  // If we encounter a duplicate key error, which should only arise if the transactionId already exists in the database, we perform a NO-OP update statement to catch and disregard the error.
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (
      userId, familyId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId, environment, expirationDate, inAppOwnershipType,
      offerIdentifier, offerType, originalTransactionId, productId,
      purchaseDate, quantity, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId
    )
    VALUES
    (
      ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, 
      ?, ?, ?, ?,
      ?, ?
    )
    ON DUPLICATE KEY UPDATE transactionId=transactionId`,
    [
      userId, familyId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId, environment, expiresDate, inAppOwnershipType,
      offerIdentifier, offerType, originalTransactionId, productId,
      purchaseDate, quantity, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId,
    ],
  );
}

async function createTransactionForAppStoreReceiptURL(databaseConnection, userId, familyId, appStoreReceiptURL) {
  console.log('createTransactionForAppStoreReceiptURL');
  // TODO NOW TEST this function
  if (areAllDefined(databaseConnection, userId, familyId, appStoreReceiptURL) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or appStoreReceiptURL missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const transactionId = formatNumber(extractTransactionIdFromAppStoreReceiptURL(appStoreReceiptURL));

  if (areAllDefined(transactionId) === false) {
    throw new ValidationError('transactionId couldn\'t be constructed with extractTransactionIdFromAppStoreReceiptURL', global.CONSTANT.ERROR.VALUE.INVALID);
  }

  const transactions = await queryTransactionsFromAppStoreServerAPI(transactionId);

  if (areAllDefined(transactionId) === false) {
    throw new ValidationError('transactions couldn\'t be queried with queryTransactionsFromAppStoreServerAPI', global.CONSTANT.ERROR.VALUE.INVALID);
  }

  // First, we find the corresponding transaction to our original transactionId
  const targetTransaction = transactions.find((transaction) => formatNumber(transaction.transactionId) === transactionId);

  console.log('targetTransaction', targetTransaction);

  // The create transaction for our target transaction must succeed.
  await createTransactionForTransactionInfo(
    databaseConnection,
    userId,
    familyId,
    targetTransaction.environment,
    targetTransaction.expiresDate,
    targetTransaction.inAppOwnershipType,
    targetTransaction.transactionId,
    targetTransaction.offerIdentifier,
    targetTransaction.offerType,
    targetTransaction.originalTransactionId,
    targetTransaction.productId,
    targetTransaction.purchaseDate,
    targetTransaction.quantity,
    targetTransaction.subscriptionGroupIdentifier,
    targetTransaction.transactionReason,
    targetTransaction.webOrderLineItemId,
  );

  // The create transaction for our other transactions should hopefully succeed but can fail
  // Filter out the target transaction from the transactions array
  const nonTargetTransactions = transactions.filter((transaction) => formatNumber(transaction.transactionId) !== transactionId);

  console.log('nonTargetTransactions', nonTargetTransactions);

  // Create an array of Promises
  const transactionPromises = nonTargetTransactions.map((transaction) => createTransactionForTransactionInfo(
    databaseConnection,
    userId,
    familyId,
    transaction.environment,
    transaction.expiresDate,
    transaction.inAppOwnershipType,
    transaction.transactionId,
    transaction.offerIdentifier,
    transaction.offerType,
    transaction.originalTransactionId,
    transaction.productId,
    transaction.purchaseDate,
    transaction.quantity,
    transaction.subscriptionGroupIdentifier,
    transaction.transactionReason,
    transaction.webOrderLineItemId,
  ).catch((error) => {
    // Log or handle the error here, it won't propagate further
    console.error(`Failed to create transaction for transactionId ${transaction.transactionId}:`, error);
    return null;
  }));

  // Execute all Promises concurrently
  await Promise.allSettled(transactionPromises);
}

module.exports = { createTransactionForTransactionInfo, createTransactionForAppStoreReceiptURL };
