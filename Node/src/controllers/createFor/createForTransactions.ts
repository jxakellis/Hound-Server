import { type JWSRenewalInfoDecodedPayload, type JWSTransactionDecodedPayload } from 'app-store-server-api';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

import { extractTransactionIdFromAppStoreReceiptURL } from '../../main/tools/appStoreConnectAPI/extractTransactionId.js';
import { queryAllSubscriptionsForTransactionId } from '../../main/tools/appStoreConnectAPI/queryTransactions.js';
import { getFamilyHeadUserId } from '../getFor/getForFamily.js';
import { SERVER, SUBSCRIPTION } from '../../main/server/globalConstants.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { logServerError } from '../../main/logging/logServerError.js';
import { formatDate } from '../../main/format/formatObject.js';
import { getActiveTransaction } from '../getFor/getForTransactions.js';

/**
 * Processes and updates a transaction in the database.
 * This function carries out the following operations:
 * 1. Validates the provided transaction data, ensuring that it matches the expected environment and ownership type.
 * 2. Checks for the family head user associated with the provided user ID.
 * 3. Attempts to insert the transaction into the database.
 *    a. If the transaction already exists (due to a duplicate transactionId), it updates specific values that might have changed since the transaction was last created.
 *    b. If there's a non-duplicate key error, the function throws an error.
 * 4. Ensures that the most recent transaction for the user has the appropriate auto-renewal status.
 * @param databaseConnection The database connection object.
 * @param userId The ID of the user associated with the transaction.
 * @param renewalInfo Optional renewal info associated with the transaction.
 * @param transactionInfo Detailed transaction info to be processed.
 * @returns Promise<void>
 * @throws {HoundError} If the environment does not match, ownership type is not 'PURCHASED', or if the product ID does not correspond to an existing subscription.
 * @throws {HoundError} If the user is not the head of the family.
 */
async function createUpdateTransaction(
  databaseConnection: Queryable,
  userId: string,
  renewalInfo: JWSRenewalInfoDecodedPayload | undefined,
  transactionInfo: JWSTransactionDecodedPayload,
): Promise<void> {
  console.log(`createUpdateTransaction for ${transactionInfo.productId}, ${renewalInfo?.autoRenewProductId}`);
  // userId

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // appAccountToken; A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  // autoRenewStatus; The product identifier of the subscription that will renew when the current subscription expires. autoRenewProductId == productId when a subscription is created
  // autoRenewStatus; The renewal status for an auto-renewable subscription.
  // bundleId; The bundle identifier of the app.
  // environment; The server environment, either Sandbox or Production.
  // expiresDate; The UNIX time, in milliseconds, the subscription expires or renews.
  // inAppOwnershipType; A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  // isUpgraded; A Boolean value that indicates whether the user upgraded to another subscription.
  // offerIdentifier; The identifier that contains the offer code or the promotional offer identifier.
  // offerType; A value that represents the promotional offer type. The offer types 2 and 3 have an offerIdentifier.
  // originalPurchaseDate; The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  // originalTransactionId; The transaction identifier of the original purchase.
  // productId; The product identifier of the in-app purchase.
  // purchaseDate; The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.
  // quantity; The number of consumable products the user purchased.
  // revocationDate; The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.
  // revocationReason; The reason that the App Store refunded the transaction or revoked it from Family Sharing.
  // signedDate; The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.
  // storefront; The three-letter code that represents the country or region associated with the App Store storefront for the purchase.
  // storefrontId; An Apple-defined value that uniquely identifies the App Store storefront associated with the purchase.
  // The identifier of the subscription group the subscription belongs to.
  // The unique identifier of the transaction.
  // The reason for the purchase transaction, which indicates whether it’s a customer’s purchase or a renewal for an auto-renewable subscription that the system initiates.
  // type; The type of the in-app purchase.
  // The unique identifier of subscription purchase events across devices, including subscription renewals.

  if (transactionInfo.environment !== SERVER.ENVIRONMENT) {
    throw new HoundError(`environment must be '${SERVER.ENVIRONMENT}', not '${transactionInfo.environment}'`, createUpdateTransaction, ERROR_CODES.VALUE.INVALID);
  }

  if (transactionInfo.inAppOwnershipType !== 'PURCHASED') {
    throw new HoundError(`inAppOwnershipType must be 'PURCHASED', not '${transactionInfo.inAppOwnershipType}'`, createUpdateTransaction, ERROR_CODES.VALUE.INVALID);
  }

  const correspondingProduct = SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === transactionInfo.productId);

  if (correspondingProduct === undefined || correspondingProduct === null) {
    throw new HoundError('correspondingProduct missing', createUpdateTransaction, ERROR_CODES.VALUE.MISSING);
  }

  const { numberOfFamilyMembers, numberOfDogs } = correspondingProduct;

  const familyHeadUserId = await getFamilyHeadUserId(databaseConnection, userId);

  if (familyHeadUserId !== userId) {
    throw new HoundError('You are not the family head. Only the family head can modify the family subscription', createUpdateTransaction, ERROR_CODES.PERMISSION.INVALID.FAMILY);
  }

  console.log('Before INSERT INTO transactions');
  console.log(await getActiveTransaction(databaseConnection, userId));

  // We attempt to insert the transaction.
  // If we encounter a duplicate key error, attempt to update values that could have possible been updated since the transaction was last created
  // We only update these values if they have been provided a value, as its possible to invoke this function with undefined, e.g. autoRenewProductId, and then we defaul it to a value, e.g. productId
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
      (
        userId,
        numberOfFamilyMembers, numberOfDogs,
        autoRenewProductId, autoRenewStatus,
        environment, expiresDate, inAppOwnershipType,
        offerIdentifier, offerType, originalTransactionId, productId,
        purchaseDate, quantity, revocationReason, subscriptionGroupIdentifier,
        transactionId, transactionReason, webOrderLineItemId
        )
        VALUES
        (
          ?,
          ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
          autoRenewProductId = CASE WHEN ? IS NOT NULL THEN ? ELSE autoRenewProductId END,
          autoRenewStatus = CASE WHEN ? IS NOT NULL THEN ? ELSE autoRenewStatus END,
          revocationReason = VALUES(revocationReason)`,
    [
      userId,
      numberOfFamilyMembers, numberOfDogs,
      // We undefined-coaless the values here in the case they don't exist
      renewalInfo?.autoRenewProductId ?? transactionInfo.productId, renewalInfo?.autoRenewStatus ?? 1,
      transactionInfo.environment, formatDate(transactionInfo.expiresDate), transactionInfo.inAppOwnershipType,
      transactionInfo.offerIdentifier, transactionInfo.offerType, transactionInfo.originalTransactionId, transactionInfo.productId,
      formatDate(transactionInfo.purchaseDate), transactionInfo.quantity, transactionInfo.revocationReason, transactionInfo.subscriptionGroupIdentifier,
      transactionInfo.transactionId, transactionInfo.transactionReason, transactionInfo.webOrderLineItemId,
      // We pass through the true, non undefined-coalessed, values here for the UPDATE statement
      renewalInfo?.autoRenewProductId, renewalInfo?.autoRenewProductId,
      renewalInfo?.autoRenewStatus, renewalInfo?.autoRenewStatus,
    ],
  );

  /*
          * Find the most recent transaction, with the most up-to-date autoRenewStatus, for a userId
          * If the transaction is the most recent, leave its autoRenewStatus alone
          * If the transaction isn't the most recent, then it cannot possibly be renewing.
          * Upgrades make new transactions (so new transaction is now renewing) and downgrades update existing transactions (so existing transaction is still renewing)
          */

  console.log('After INSERT INTO transactions');
  console.log(await getActiveTransaction(databaseConnection, userId));

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

  console.log('After UPDATE transactions');
  console.log(await getActiveTransaction(databaseConnection, userId));
}

async function createTransactionForAppStoreReceiptURL(databaseConnection: Queryable, userId: string, appStoreReceiptURL: string): Promise<void> {
  const transactionId = extractTransactionIdFromAppStoreReceiptURL(appStoreReceiptURL);

  if (transactionId === undefined || transactionId === null) {
    throw new HoundError('transactionId couldn\'t be constructed with extractTransactionIdFromAppStoreReceiptURL', createTransactionForAppStoreReceiptURL, ERROR_CODES.VALUE.INVALID);
  }

  const subscriptions = await queryAllSubscriptionsForTransactionId(transactionId.toString());

  if (subscriptions.length === 0) {
    throw new HoundError('subscriptions couldn\'t be queried with querySubscriptionStatusesFromAppStoreAPI', createTransactionForAppStoreReceiptURL, ERROR_CODES.VALUE.INVALID);
  }

  // Create an array of Promises
  const subscriptionPromises = subscriptions.map((subscription) => createUpdateTransaction(
    databaseConnection,
    userId,
    subscription.renewalInfo,
    subscription.transactionInfo,
  ).catch((error) => {
    // Log or handle the error here, it won't propagate further
    logServerError(
      new HoundError(
        `Failed to create transaction for transactionId ${subscription.transactionInfo.transactionId}`,
        createTransactionForAppStoreReceiptURL,
        undefined,
        error,
      ),
    );
    return undefined;
  }));

  // Execute all Promises concurrently
  await Promise.allSettled(subscriptionPromises);
}

export { createUpdateTransaction, createTransactionForAppStoreReceiptURL };
