const axios = require('axios').default;

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatDate, formatBase64EncodedString, formatArray, formatNumber, formatString, formatBoolean,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ExternalServerError, ValidationError } = require('../../main/tools/general/errors');
const { appSpecificSharedSecret } = require('../../main/secrets/appSpecificSharedSecret');
const { logServerError } = require('../../main/tools/logging/logServerError');

const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');
const { getActiveInAppSubscriptionForFamilyId } = require('../getFor/getForInAppSubscriptions');

const { reassignActiveSubscriptionsToNewFamilyForUserIdFamilyId } = require('../updateFor/updateForInAppSubscriptions');

/**
 *  Contacts Apple's server to retrieve records of any transaction, given the appStoreReceiptURL
 *  Queries the database to update all transaction records, so that all transactions returned by Apple are stored correctly.
 *  If the query is successful, then returns the active subscription for the family.
 *  If a problem is encountered, creates and throws custom error
 */
async function createTransactionsForAppStoreReceiptURL(databaseConnection, userId, familyId, forBase64EncodedAppStoreReceiptURL) {
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

  // CANT PROMISE.ALL BECAUSE createTransactionsForReceipts CHANGES RESULT OF getActiveInAppSubscriptionForFamilyId
  // update the records stored for all receipts returned
  await createTransactionsForReceipts(databaseConnection, userId, familyId, environment, receipts);

  // Can't user .familyActiveSubscription property as subscription was updated. Therefore, get the most recent subscription to return to the user
  return getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);
}

/**
 * Helper function for createTransactionsForAppStoreReceiptURL
 * Takes array of latest_receipt_info from the Apple /verifyReceipt API endpoint
 * Filters the receipts against productIds that are known
 * Compare receipts to stored transactions, inserting receipts into the database that aren't stored
 */
async function createTransactionsForReceipts(databaseConnection, userId, familyId, forEnvironment, forReceipts) {
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

    const storedTransaction = storedTransactions.find((stored) => formatNumber(stored.transactionId) === transactionId);
    // Verify the transaction isn't already in the database
    // Currently, the data we store on transactions is the same whether is through a receipt or an app store server notification
    if (areAllDefined(storedTransaction) === true) {
      continue;
    }
    promises.push(insertTransactionForTransactionInfo(
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
      // In testing, after purchasing the free trial, is_trial_period was true but is_in_intro_offer_period was false. That is odd.
      formatBoolean(receipt.is_in_intro_offer_period) || formatBoolean(receipt.is_trial_period),
      receipt.offer_code_ref_name,
    ));
  }

  // Resolves all promises in the array.
  // Evein if one fails, does not return error (this can occur if a user has purchased a subscription, deleted their account, created a new account, then purchased a new subscription).
  // Returns array of JSON with promise status and value/error
  await Promise.allSettled(promises);

  // now all of the receipts returned by apple (who's productId's match one that is known to us) are stored in our database
  await reassignActiveSubscriptionsToNewFamilyForUserIdFamilyId(databaseConnection, userId, familyId);
}

async function insertTransactionForTransactionInfo(
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
  forIsInIntroductoryPeriod,
  forOfferCode,
) {
  // TODO NOW TEST that the offer code is recieve from both server and reciept
  console.log(`insertTransactionForTransactionInfo did recieve ${forOfferCode}`);
  // userId
  // familyId
  const transactionId = formatNumber(forTransactionId);
  const originalTransactionId = formatNumber(forOriginalTransactionId);
  const environment = formatString(forEnvironment, 10);
  const productId = formatString(forProductId, 60);
  const subscriptionGroupIdentifier = formatNumber(forSubscriptionGroupIdentifier);
  const purchaseDate = formatDate(formatNumber(forPurchaseDateMS));
  const expirationDate = formatDate(formatNumber(forExpirationDateMS));
  const quantity = formatNumber(forQuantity);
  const webOrderLineItemId = formatNumber(forWebOrderLineItemId);
  const inAppOwnershipType = formatString(forInAppOwnershipType, 13);
  // autoRenewProductId == productId when a subscription is created
  const autoRenewProductId = formatString(forProductId, 60);
  const isInIntroductoryPeriod = formatBoolean(forIsInIntroductoryPeriod);
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
    autoRenewProductId,
    isInIntroductoryPeriod,
    // offerCode doesn't have to be defined
  ) === false) {
    throw new ValidationError(`databaseConnection,
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
autoRenewProductId,
or isInIntroductoryPeriod missing`, global.CONSTANT.ERROR.VALUE.MISSING);
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
  autoRenewProductId
  isInIntroductoryPeriod
  NOT INCLUDED AT THIS STAGE isRevoked
  offerCode
  */
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (transactionId, originalTransactionId, userId, familyId, environment, productId, 
    subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, 
    numberOfDogs, quantity, webOrderLineItemId, inAppOwnershipType, autoRenewProductId, isInIntroductoryPeriod, offerCode) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      originalTransactionId,
      userId,
      familyId,
      environment,
      productId,
      subscriptionGroupIdentifier,
      purchaseDate,
      expirationDate,
      numberOfFamilyMembers,
      numberOfDogs,
      quantity,
      webOrderLineItemId,
      inAppOwnershipType,
      autoRenewProductId,
      isInIntroductoryPeriod,
      offerCode,
    ],
  );
}

module.exports = { createTransactionsForAppStoreReceiptURL, insertTransactionForTransactionInfo };
