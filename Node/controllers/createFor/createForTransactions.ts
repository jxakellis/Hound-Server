import { databaseQuery } from '../../main/database/databaseQuery';
import {
  formatDate, formatNumber, formatUnknownString, formatBoolean,
} from '../../main/format/formatObject';
import { ValidationError } from '../../main/server/globalErrors';

import { extractTransactionIdFromAppStoreReceiptURL } from '../../main/tools/appStoreConnectAPI/extractTransactionId';
import { queryAllSubscriptionsForTransactionId } from '../../main/tools/appStoreConnectAPI/queryTransactions';
import { getFamilyHeadUserId } from '../getFor/getForFamily';

/**
 * TODO NOW update documentation. incorrect
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
async function createUpdateTransaction(
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
  // userId

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // appAccountToken; A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  // The product identifier of the subscription that will renew when the current subscription expires. autoRenewProductId == productId when a subscription is created
  const autoRenewProductId = formatUnknownString(forAutoRenewProductId, 60);
  // The renewal status for an auto-renewable subscription.
  const autoRenewStatus = formatBoolean(forAutoRenewStatus);
  // bundleId; The bundle identifier of the app.
  // The server environment, either Sandbox or Production.
  const environment = formatUnknownString(forEnvironment, 10);
  // The UNIX time, in milliseconds, the subscription expires or renews.
  const expiresDate = formatDate(formatNumber(forExpiresDate));
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const inAppOwnershipType = formatUnknownString(forInAppOwnershipType, 13);
  // isUpgraded; A Boolean value that indicates whether the user upgraded to another subscription.
  // The identifier that contains the offer code or the promotional offer identifier.
  const offerIdentifier = formatUnknownString(forOfferIdentifier, 64);
  // A value that represents the promotional offer type. The offer types 2 and 3 have an offerIdentifier.
  const offerType = formatNumber(forOfferType);
  // originalPurchaseDate; The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  // The transaction identifier of the original purchase.
  const originalTransactionId = formatNumber(forOriginalTransactionId);
  // The product identifier of the in-app purchase.
  const productId = formatUnknownString(forProductId, 60);
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
  const transactionReason = formatUnknownString(forTransactionReason, 8);
  // type; The type of the in-app purchase.
  // The unique identifier of subscription purchase events across devices, including subscription renewals.
  const webOrderLineItemId = formatNumber(forWebOrderLineItemId);

  if (areAllDefined(
    databaseConnection,
    userId,
    // autoRenewProductId is optionally defined
    // autoRenewStatus is optionally defined
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
    transactionId, transactionReason, or webOrderLineItemId is missing`, ERROR_CODES.VALUE.MISSING);
  }

  if (environment !== SERVER.ENVIRONMENT) {
    throw new ValidationError(`environment must be '${SERVER.ENVIRONMENT}', not '${environment}'`, ERROR_CODES.VALUE.INVALID);
  }

  if (inAppOwnershipType !== 'PURCHASED') {
    throw new ValidationError(`inAppOwnershipType must be 'PURCHASED', not '${inAppOwnershipType}'`, ERROR_CODES.VALUE.INVALID);
  }

  const correspondingProduct = SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === productId);

  if (areAllDefined(correspondingProduct) === false) {
    throw new ValidationError('correspondingProduct missing', ERROR_CODES.VALUE.MISSING);
  }

  const { numberOfFamilyMembers, numberOfDogs } = correspondingProduct;

  if (areAllDefined(numberOfFamilyMembers, numberOfDogs) === false) {
    throw new ValidationError('numberOfFamilyMembers or numberOfDogs missing', ERROR_CODES.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', ERROR_CODES.PERMISSION.INVALID.FAMILY);
  }

  // We attempt to insert the transaction.
  // If we encounter a duplicate key error, attempt to update values that could have possible been updated since the transaction was last created
  // We only update these values if they have been provided a value, as its possible to invoke this function with null, e.g. autoRenewProductId, and then we defaul it to a value, e.g. productId
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (
      userId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId,
      autoRenewStatus,
      environment, expiresDate, inAppOwnershipType,
      offerIdentifier, offerType, originalTransactionId, productId,
      purchaseDate, quantity, revocationReason, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId
    )
    VALUES
    (
      ?,
      ?, ?,
      ?,
      ?,
      ?, ?, ?,
      ?, ?, ?, ?, 
      ?, ?, ?, ?, ?,
      ?, ?
    )
    ON DUPLICATE KEY UPDATE
      autoRenewProductId = CASE WHEN ? IS NOT NULL THEN ? ELSE autoRenewProductId END,
      autoRenewStatus = CASE WHEN ? IS NOT NULL THEN ? ELSE autoRenewStatus END,
      revocationReason = VALUES(revocationReason)`,
    [
      userId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId ?? productId,
      autoRenewStatus ?? true,
      environment, expiresDate, inAppOwnershipType,
      offerIdentifier, offerType, originalTransactionId, productId,
      purchaseDate, quantity, revocationReason, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId,
      autoRenewProductId, autoRenewProductId,
      autoRenewStatus, autoRenewStatus,
    ],
  );

  /*
  * Find the most recent transaction, with the most up-to-date autoRenewStatus, for a userId
  * If the transaction is the most recent, leave its autoRenewStatus alone
  * If the transaction isn't the most recent, then it cannot possibly be renewing.
  * Upgrades make new transactions (so new transaction is now renewing) and downgrades update existing transactions (so existing transaction is still renewing)
  */

  await databaseQuery(
    databaseConnection,
    `
    UPDATE transactions t
    JOIN (
      SELECT transactionId, autoRenewProductId, autoRenewStatus
      FROM transactions
      WHERE revocationReason IS NULL AND userId = ?
      ORDER BY purchaseDate DESC
      LIMIT 1
      ) mrt
      ON t.userId = ?
      SET t.autoRenewStatus =
      CASE
      WHEN t.transactionId = mrt.transactionId THEN mrt.autoRenewStatus
      ELSE 0
      END`,
    [userId, userId],
  );
}

async function createTransactionForAppStoreReceiptURL(databaseConnection, userId, appStoreReceiptURL) {
  if (areAllDefined(databaseConnection, userId, appStoreReceiptURL) === false) {
    throw new ValidationError('databaseConnection, userId, or appStoreReceiptURL missing', ERROR_CODES.VALUE.MISSING);
  }

  const transactionId = formatNumber(extractTransactionIdFromAppStoreReceiptURL(appStoreReceiptURL));

  if (areAllDefined(transactionId) === false) {
    throw new ValidationError('transactionId couldn\'t be constructed with extractTransactionIdFromAppStoreReceiptURL', ERROR_CODES.VALUE.INVALID);
  }

  const subscriptions = await queryAllSubscriptionsForTransactionId(transactionId);

  if (areAllDefined(subscriptions) === false || subscriptions.length === 0) {
    throw new ValidationError('subscriptions couldn\'t be queried with querySubscriptionStatusesFromAppStoreAPI', ERROR_CODES.VALUE.INVALID);
  }

  // Create an array of Promises
  const subscriptionPromises = subscriptions.map((subscription) => createUpdateTransaction(
    databaseConnection,
    userId,
    subscription.autoRenewProductId,
    subscription.autoRenewStatus,
    subscription.environment,
    subscription.expiresDate,
    subscription.inAppOwnershipType,
    subscription.transactionId,
    subscription.offerIdentifier,
    subscription.offerType,
    subscription.originalTransactionId,
    subscription.productId,
    subscription.purchaseDate,
    subscription.quantity,
    subscription.revocationReason,
    subscription.subscriptionGroupIdentifier,
    subscription.transactionReason,
    subscription.webOrderLineItemId,
  ).catch((error) => {
    // Log or handle the error here, it won't propagate further
    console.error(`Failed to create transaction for transactionId ${subscription.transactionId}:`, error);
    return null;
  }));

  // Execute all Promises concurrently
  await Promise.allSettled(subscriptionPromises);
}

export { createUpdateTransaction, createTransactionForAppStoreReceiptURL };
