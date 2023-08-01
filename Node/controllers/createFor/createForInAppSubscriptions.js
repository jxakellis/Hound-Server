const axios = require('axios').default;

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatDate, formatBase64EncodedString, formatArray, formatNumber, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ExternalServerError, ValidationError } = require('../../main/tools/general/errors');
const { appSpecificSharedSecret } = require('../../main/secrets/appSpecificSharedSecret');
const { logServerError } = require('../../main/tools/logging/logServerError');

const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');
const { getActiveInAppSubscriptionForFamilyId } = require('../getFor/getForInAppSubscriptions');

const { reassignActiveInAppSubscriptionForUserIdFamilyId } = require('../updateFor/updateForInAppSubscriptions');

/**
 *  Contacts Apple's server to retrieve records of any transaction, given the appStoreReceiptURL
 *  Queries the database to update all transaction records, so that all transactions returned by Apple are stored correctly.
 *  If the query is successful, then returns the active subscription for the family.
 *  If a problem is encountered, creates and throws custom error
 */
async function createInAppSubscriptionForUserIdFamilyIdRecieptId(databaseConnection, userId, familyId, forBase64EncodedAppStoreReceiptURL) {
  // Takes a base64 encoded appStoreReceiptURL from a user
  const appStoreReceiptURL = formatBase64EncodedString(forBase64EncodedAppStoreReceiptURL);

  if (areAllDefined(databaseConnection, userId, familyId, appStoreReceiptURL) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or appStoreReceiptURL missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  const requestBody = {
    // (Required) The Base64-encoded receipt data.
    'receipt-data': appStoreReceiptURL,
    // password (string): Your app’s shared secret, which is a hexadecimal string. For more information about the shared secret, see Generate a Receipt Validation Code.
    password: appSpecificSharedSecret,
    // Set this value to true for the response to include only the latest renewal transaction for any subscriptions. Use this field only for app receipts that contain auto-renewable subscriptions.
    'exclude-old-transactions': false,
  };

  let result;
  try {
    // query Apple's iTunes server to verify that the receipt is valid
    result = await axios.post('https://buy.itunes.apple.com/verifyReceipt', requestBody);
    // 21007 status indicates that the receipt is from the sandbox environment, so we retry with the sandbox url
    if (result.data.status === 21007) {
      result = await axios.post('https://sandbox.itunes.apple.com/verifyReceipt', requestBody);
    }
  }
  catch (error) {
    logServerError('axios.post(\'https://buy.itunes.apple.com/verifyReceipt\', requestBody)', error);
    throw new ExternalServerError('Axios failed to query https://buy.itunes.apple.com/verifyReceipt. We could not verify the receipt', global.CONSTANT.ERROR.GENERAL.APPLE_SERVER_FAILED);
  }

  // verify that the status is successful
  if (formatNumber(result.data.status) !== 0) {
    throw new ValidationError(
      `Status of ${result.data.status} from https://buy.itunes.apple.com/verifyReceipt is not valid. We could not verify the receipt`,
      global.CONSTANT.ERROR.VALUE.INVALID,
    );
  }

  // check to see the result has a body
  const resultBody = result.data;
  if (areAllDefined(resultBody) === false) {
    throw new ValidationError("Unable to parse the resultBody from Apple's iTunes servers", global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // check to see .latest_receipt_info array exists
  const environment = formatString(resultBody.environment, 10);
  const receipts = formatArray(resultBody.latest_receipt_info);
  if (areAllDefined(receipts, environment) === false) {
    throw new ValidationError("Unable to parse the receipts or environment from Apple's iTunes servers", global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // CANT PROMISE.ALL BECAUSE createTransactionsForUserIdFamilyIdEnvironmentReceipts CHANGES RESULT OF getActiveInAppSubscriptionForFamilyId
  // update the records stored for all receipts returned
  await createTransactionsForUserIdFamilyIdEnvironmentReceipts(databaseConnection, userId, familyId, environment, receipts);

  // Can't user .familyActiveSubscription property as subscription was updated. Therefore, get the most recent subscription to return to the user
  return getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);
}

/**
 * Helper function for createInAppSubscriptionForUserIdFamilyIdRecieptId
 * Takes array of latest_receipt_info from the Apple /verifyReceipt API endpoint
 * Filters the receipts against productIds that are known
 * Compare receipts to stored transactions, inserting receipts into the database that aren't stored
 */
async function createTransactionsForUserIdFamilyIdEnvironmentReceipts(databaseConnection, userId, familyId, forEnvironment, forReceipts) {
  const environment = formatString(forEnvironment, 10);
  const receipts = formatArray(forReceipts);

  if (areAllDefined(databaseConnection, userId, familyId, receipts) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or receipts missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // find all of our currently stored transactions for the user
  // Specifically don't filter by familyId, as we want to reflect all of the stored transactions for a user (regardless of what family they were in at the time)

  const storedTransactions = await databaseQuery(
    databaseConnection,
    `SELECT transactionId
    FROM transactions t
    WHERE userId = ?
    LIMIT 18446744073709551615`,
    [userId],
  );

  // iterate through all the receipts that exist
  const promises = [];
  for (let i = 0; i < receipts.length; i += 1) {
    const receipt = receipts[i];
    const transactionId = formatNumber(receipt.transaction_id);

    // Verify the transaction isn't already in the database
    // Currently, the data we store on transactions is the same whether is through a receipt or an app store server notification
    if (storedTransactions.some((storedTransaction) => formatNumber(storedTransaction.transactionId) === transactionId) === true) {
      continue;
    }
    promises.push(createInAppSubscriptionForUserIdFamilyIdTransactionInfo(
      databaseConnection,
      userId,
      familyId,
      transactionId,
      receipt.original_transaction_id,
      environment,
      receipt.product_id,
      receipt.subscription_group_identifier,
      receipt.purchase_date_ms,
      receipt.expires_date_ms,
      receipt.quantity,
      receipt.web_order_line_item_id,
      receipt.in_app_ownership_type,
      receipt.offer_code_ref_name,
    ));
  }

  // Resolves all promises in the array.
  // Evein if one fails, does not return error (this can occur if a user has purchased a subscription, deleted their account, created a new account, then purchased a new subscription).
  // Returns array of JSON with promise status and value/error
  await Promise.allSettled(promises);

  // now all of the receipts returned by apple (who's productId's match one that is known to us) are stored in our database
  await reassignActiveInAppSubscriptionForUserIdFamilyId(databaseConnection, userId, familyId);
}

/**
  Verifies the information for the subscription is valid, then inserts it into the database
  https://developer.apple.com/documentation/appstorereceipts/responsebody/latest_receipt_info

  app_account_token: The appAccountToken associated with this transaction. This field is only present if your app supplied an appAccountToken(_:) or provided a UUID for the applicationUsername property when the user made the purchase.
  cancellation_date: The time the App Store refunded a transaction or revoked it from Family Sharing, in a date-time format similar to the ISO 8601. This field is present only for refunded or revoked transactions.
  cancellation_date_ms: The time the App Store refunded a transaction or revoked it from Family Sharing, in UNIX epoch time format, in milliseconds. This field is present only for refunded or revoked transactions. Use this time format for processing dates.
  cancellation_date_pst: The time the App Store refunded a transaction or revoked it from Family Sharing, in Pacific Standard Time. This field is present only for refunded or revoked transactions.
  cancellation_reason: The reason for a refunded or revoked transaction. A value of 1 indicates that the customer canceled their transaction due to an actual or perceived issue within your app. A value of 0 indicates that the transaction was canceled for another reason; for example, if the customer made the purchase accidentally.
  expires_date: The time an auto-renewable subscription expires or when it will renew, in a date-time format similar to the ISO 8601.
  expires_date_ms:The time an auto-renewable subscription expires or when it will renew, in UNIX epoch time format, in milliseconds. Use this time format for processing dates.
  expires_date_pst:The time an auto-renewable subscription expires or when it will renew, in Pacific Standard Time.
  in_app_ownership_type: A value that indicates whether the user is the purchaser of the product or is a family member with access to the product through Family Sharing.
  is_in_intro_offer_period: An indicator of whether an auto-renewable subscription is in the introductory price period. See is_in_intro_offer_period for more information.
  is_trial_period: An indicator of whether an auto-renewable subscription is in the free trial period.
  is_upgraded: An indicator that an auto-renewable subscription has been canceled due to an upgrade. This field is only present for upgrade transactions.
  offer_code_ref_name: The reference name of a subscription offer that you configured in App Store Connect. This field is present when a customer redeems a subscription offer code. For more information about offer codes, see Set Up Offer Codes, and Implementing Offer Codes in Your App.
  original_purchase_date: The time of the original app purchase, in a date-time format similar to ISO 8601.
  original_purchase_date_ms: The time of the original app purchase, in UNIX epoch time format, in milliseconds. Use this time format for processing dates. For an auto-renewable subscription, this value indicates the date of the subscription’s initial purchase. The original purchase date applies to all product types and remains the same in all transactions for the same product ID. This value corresponds to the original transaction’s transactionDate property in StoreKit.
  original_purchase_date_pst: The time of the original app purchase, in Pacific Standard Time.
  original_transaction_id: The transaction identifier of the original purchase.
  product_id: The unique identifier of the product purchased. You provide this value when creating the product in App Store Connect, and it corresponds to the productIdentifier property of the SKPayment object stored in the transaction’s payment property.
  promotional_offer_id: The identifier of the subscription offer redeemed by the user.
  purchase_date: The time the App Store charged the user’s account for a purchased or restored product, or the time the App Store charged the user’s account for a subscription purchase or renewal after a lapse, in a date-time format similar to ISO 8601.
  purchase_date_ms: For consumable, non-consumable, and non-renewing subscription products, the time the App Store charged the user’s account for a purchased or restored product, in the UNIX epoch time format, in milliseconds. For auto-renewable subscriptions, the time the App Store charged the user’s account for a subscription purchase or renewal after a lapse, in the UNIX epoch time format, in milliseconds. Use this time format for processing dates.
  purchase_date_pst: The time the App Store charged the user’s account for a purchased or restored product, or the time the App Store charged the user’s account for a subscription purchase or renewal after a lapse, in Pacific Standard Time.
  quantity: The number of consumable products purchased. This value corresponds to the quantity property of the SKPayment object stored in the transaction’s payment property. The value is usually 1 unless modified with a mutable payment. The maximum value is 10.
  subscription_group_identifier: The identifier of the subscription group to which the subscription belongs. The value for this field is identical to the subscriptionGroupIdentifier property in SKProduct.
  web_order_line_item_id: A unique identifier for purchase events across devices, including subscription-renewal events. This value is the primary key for identifying subscription purchases.
  transaction_id: A unique identifier for a transaction such as a purchase, restore, or renewal.
 */
async function createInAppSubscriptionForUserIdFamilyIdTransactionInfo(
  databaseConnection,
  userId,
  familyId,
  forTransactionId,
  forOriginalTransactionId,
  forEnvironment,
  forProductId,
  forSubscriptionGroupIdentifier,
  forPurchaseDateMS,
  forExpirationDateMS,
  forQuantity,
  forWebOrderLineItemId,
  forInAppOwnershipType,
  forOfferCode,
) {
  // TODO NOW TEST that the offer code is recieve from both server and reciept
  console.log(`createInAppSubscriptionForUserIdFamilyIdTransactionInfo did recieve ${forOfferCode}`);
  // userId
  // familyId
  const transactionId = formatNumber(forTransactionId);
  const originalTransactionId = formatNumber(forOriginalTransactionId);
  const environment = formatString(forEnvironment, 10);
  const productId = formatString(forProductId, 60);
  const subscriptionGroupIdentifier = formatNumber(forSubscriptionGroupIdentifier);
  const purchaseDate = formatDate(formatNumber(forPurchaseDateMS));
  const expirationDate = formatDate(
    formatNumber(forExpirationDateMS)
         + (environment === 'Sandbox' ? global.CONSTANT.SUBSCRIPTION.SANDBOX_EXPIRATION_DATE_EXTENSION : 0),
  );
  const quantity = formatNumber(forQuantity);
  const webOrderLineItemId = formatNumber(forWebOrderLineItemId);
  const inAppOwnershipType = formatString(forInAppOwnershipType, 13);
  const offerCode = formatString(forOfferCode, 64);

  if (areAllDefined(
    databaseConnection,
    userId,
    familyId,
    transactionId,
    originalTransactionId,
    environment,
    productId,
    subscriptionGroupIdentifier,
    purchaseDate,
    expirationDate,
    quantity,
    webOrderLineItemId,
    inAppOwnershipType,
    // offerCode doesn't have to be defined
  ) === false) {
    throw new ValidationError(`databaseConnection,
userId
familyId
transactionId
originalTransactionId
environment
productId
subscriptionGroupIdentifier
purchaseDate
expirationDate
quantity
webOrderLineItemId
or inAppOwnershipType missing`, global.CONSTANT.ERROR.VALUE.MISSING);
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

  if (inAppOwnershipType !== 'PURCHASED') {
    throw new ValidationError(`inAppOwnershipType must be PURCHASED, not ${inAppOwnershipType}`, global.CONSTANT.ERROR.VALUE.INVALID);
  }

  /*
  transactionId
  originalTransactionId
  userId
  familyId
  environment
  productId
  subscriptionGroupIdentifier
  purchaseDate
  expirationDate
  numberOfFamilyMembers
  numberOfDogs
  quantity
  webOrderLineItemId
  inAppOwnershipType
  NOT INCLUDED AT THIS STAGE isAutoRenewing
  NOT INCLUDED AT THIS STAGE isRevoked
  offerCode
  */
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (transactionId, originalTransactionId, userId, familyId, environment, productId, 
    subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, 
    numberOfDogs, quantity, webOrderLineItemId, inAppOwnershipType, offerCode) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      originalTransactionId,
      userId,
      familyId,
      environment,
      productId,
      subscriptionGroupIdentifier,
      purchaseDate,
      new Date(expirationDate.getTime() + (environment === 'Sandbox' ? global.CONSTANT.SUBSCRIPTION.SANDBOX_EXPIRATION_DATE_EXTENSION : 0)),
      numberOfFamilyMembers,
      numberOfDogs,
      quantity,
      webOrderLineItemId,
      inAppOwnershipType,
      offerCode,
    ],
  );
}

module.exports = { createInAppSubscriptionForUserIdFamilyIdRecieptId, createInAppSubscriptionForUserIdFamilyIdTransactionInfo };
