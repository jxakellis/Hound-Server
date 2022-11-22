const axios = require('axios').default;
const { GeneralError, ValidationError } = require('../../main/tools/general/errors');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { houndSharedSecret } = require('../../main/secrets/houndSharedSecret');
const {
  formatDate, formatBase64EncodedString, formatArray, formatNumber, formatString,
} = require('../../main/tools/format/formatObject');
const { getActiveInAppSubscriptionForFamilyId } = require('../getFor/getForInAppSubscriptions');
const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

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
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.FAMILY.PERMISSION.INVALID);
  }

  const requestBody = {
    // (Required) The Base64-encoded receipt data.
    'receipt-data': appStoreReceiptURL,
    // password (string): Your app’s shared secret, which is a hexadecimal string. For more information about the shared secret, see Generate a Receipt Validation Code.
    password: houndSharedSecret,
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
    throw new GeneralError("There was an error querying Apple's iTunes server to verify the receipt", global.CONSTANT.ERROR.GENERAL.APPLE_SERVER_FAILED);
  }

  // verify that the status is successful
  if (formatNumber(result.data.status) !== 0) {
    throw new GeneralError("There was an error querying Apple's iTunes server to verify the receipt", global.CONSTANT.ERROR.GENERAL.APPLE_SERVER_FAILED);
  }

  // check to see the result has a body
  const resultBody = result.data;
  if (areAllDefined(resultBody) === false) {
    throw new ValidationError("Unable to parse the responseBody from Apple's iTunes servers", global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // check to see .latest_receipt_info array exists
  const environment = formatString(resultBody.environment, 10);
  const receipts = formatArray(resultBody.latest_receipt_info);
  if (areAllDefined(receipts, environment) === false) {
    throw new ValidationError("Unable to parse the responseBody from Apple's iTunes servers", global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // CANT PROMISE.ALL BECAUSE updateReceiptRecords CHANGES RESULT OF getActiveInAppSubscriptionForFamilyId
  // update the records stored for all receipts returned
  await updateReceiptRecords(databaseConnection, userId, familyId, environment, receipts);

  // Can't user .familyActiveSubscription property as subscription was updated. Therefore, get the most recent subscription to return to the user
  return getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);
}

/**
 * Takes array of latest_receipt_info from the Apple /verifyReceipt API endpoint
 * Filters the receipts against productIds that are known
 * Compare receipts to stored transactions, inserting receipts into the database that aren't stored
 */
async function updateReceiptRecords(databaseConnection, userId, familyId, forEnvironment, forReceipts) {
  const environment = formatString(forEnvironment, 10);
  const receipts = formatArray(forReceipts);

  if (areAllDefined(databaseConnection, userId, familyId, environment, receipts) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, environment, or receipts missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Filter the receipts. Only include one which their productIds are known, and assign values if receipt is valid
  for (let i = 0; i < receipts.length; i += 1) {
    const receipt = receipts[i];
    const correspondingSubscription = global.CONSTANT.SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === receipt.product_id);

    // check to see if we found an item
    if (areAllDefined(correspondingSubscription) === false) {
      // a correspondingSubscription doesn't exist, remove the receipt from the array as incompatible
      receipts.splice(i, 1);
      // de-iterate i so we don't skip an item
      i -= 1;
    }

    // we found a corresponding subscription, assign the correst values to the receipt
    receipt.numberOfFamilyMembers = correspondingSubscription.numberOfFamilyMembers;
    receipt.numberOfDogs = correspondingSubscription.numberOfDogs;
  }

  // find all of our currently stored transactions for the user
  // Specifically don't filter by familyId, as we want to reflect all of the stored transactions for a user (regardless of what family they were in at the time)

  const storedTransactions = await databaseQuery(
    databaseConnection,
    'SELECT transactionId FROM transactions WHERE userId = ? LIMIT 18446744073709551615',
    [userId],
  );

  // iterate through all the receipts that exist
  const promises = [];
  for (let i = 0; i < receipts.length; i += 1) {
    const receipt = receipts[i];
    const transactionId = formatNumber(receipt.transaction_id);

    // check to see if we have that receipt stored in the database
    if (storedTransactions.some((storedTransaction) => formatNumber(storedTransaction.transactionId) === transactionId) === false) {
      // we don't have that receipt stored, insert it into the database

      // transactionid
      const originalTransactionid = formatNumber(receipt.original_transaction_id);
      // familyId
      // userId
      const productId = formatString(receipt.product_id, 60);
      const subscriptionGroupIdentifier = formatNumber(receipt.subscription_group_identifier);
      const purchaseDate = formatDate(formatNumber(receipt.purchase_date_ms));
      const expirationDate = formatDate(
        formatNumber(receipt.expires_date_ms)
        + (environment === 'Sandbox' ? global.CONSTANT.SUBSCRIPTION.SANDBOX_EXPIRATION_DATE_EXTENSION : 0),
      );
      const numberOfFamilyMembers = formatNumber(receipt.numberOfFamilyMembers);
      const numberOfDogs = formatNumber(receipt.numberOfDogs);
      const quantity = formatNumber(receipt.quantity);
      const webOrderLineItemId = formatNumber(receipt.web_order_line_item_id);
      const inAppOwnershipType = formatString(receipt.in_app_ownership_type, 13);
      promises.push(databaseQuery(
        databaseConnection,
        'INSERT INTO transactions(transactionId, originalTransactionId, userId, familyId, environment, productId, subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, numberOfDogs, quantity, webOrderLineItemId, inAppOwnershipType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transactionId,
          originalTransactionid,
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
        ],
      ));
    }
  }

  await Promise.all(promises);

  // now all of the receipts returned by apple (who's productId's match one that is known to us) are stored in our database
}

/**
 *  If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function createInAppSubscriptionForUserIdFamilyIdTransactionInfo(databaseConnection, transactionId, originalTransactionId, userId, familyId, environment, productId, subscriptionGroupIdentifier, purchaseDate, expirationDate, quantity, webOrderLineItemId, inAppOwnershipType) {
  if (areAllDefined(databaseConnection, transactionId, userId, familyId, environment, productId, purchaseDate, expirationDate) === false) {
    throw new ValidationError('databaseConnection, transactionId, userId, familyId, environment, productId, purchaseDate, or expirationDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.FAMILY.PERMISSION.INVALID);
  }

  const correspondingProduct = global.CONSTANT.SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === productId);
  const { numberOfFamilyMembers, numberOfDogs } = correspondingProduct;

  await databaseQuery(
    databaseConnection,
    'INSERT INTO transactions(transactionId, originalTransactionId, userId, familyId, environment, productId, subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, numberOfDogs, quantity, webOrderLineItemId, inAppOwnershipType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
    ],
  );
}

module.exports = { createInAppSubscriptionForUserIdFamilyIdRecieptId, createInAppSubscriptionForUserIdFamilyIdTransactionInfo };
