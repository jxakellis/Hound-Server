const { SortParameter, decodeTransactions } = require('app-store-server-api');
const { api } = require('./api');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');
const { formatString, formatBoolean } = require('../format/formatObject');

/**
 * Queries Apple Store Server API with the transactionId to get all records of transactions associated with that transactionId. DESC from most recently to oldest.
 * https://github.com/agisboye/app-store-server-api
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked transactions.
 * @returns An array of decodedTransactions linked to transactionId or null
 */
async function queryTransactionsFromAppStoreServerAPI(transactionId) {
  return queryTransactionsFromAppStoreServerAPIWithPreviousResponse(transactionId, null);
}

/**
 * Internal function.
 * We don't expose previousResponse to outside this file, as it's value is generated by this functions body.
 * Queries Apple Store Server API with the transactionId to get all records of transactions associated with that transactionId. DESC from most recently to oldest.
 * https://github.com/agisboye/app-store-server-api
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked transactions.
 * @param {*} previousResponse The previousResponse from a previous invocation of queryTransactionsFromAppStoreServerAPI, used internally for response.hasMore
 * @returns An array of decodedTransactions linked to transactionId or null
 */
async function queryTransactionsFromAppStoreServerAPIWithPreviousResponse(transactionId, previousResponse) {
  console.log('queryTransactionsFromAppStoreServerAPIWithPreviousResponse');
  // TODO NOW TEST this function
  if (areAllDefined(transactionId) === false) {
    return null;
  }

  // Query Apple's servers to attempt to get the transaction history linked to a transactionId from an AppStoreReceiptURL
  let response;
  try {
    response = await api.getTransactionHistory(transactionId, {
      sort: SortParameter.Descending,
      // must be undefined, not null
      revision: areAllDefined(previousResponse) ? previousResponse.revision : undefined,
    });
  }
  catch (error) {
    console.log('getTransactionHistory error', error);
    logServerError('queryTransactionsFromAppStoreServerAPIWithPreviousResponse getTransactionHistory', error);
    return null;
  }

  console.log('appAppleId', response.appAppleId);

  if (formatString(response.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    console.log('bundleId error', response.bundleId);
    return null;
  }

  if (formatString(response.environment) !== global.CONSTANT.SERVER.ENVIRONMENT) {
    console.log('environment error', response.bundleId);
    return null;
  }

  // Decoding not only reveals the contents of the transactions but also verifies that they were signed by Apple.
  let transactions;
  try {
    transactions = await decodeTransactions(response.signedTransactions);
  }
  catch (error) {
    console.log('decodeTransactions error', response.bundleId);
    logServerError('queryTransactionsFromAppStoreServerAPIWithPreviousResponse decodeTransactions', error);
    return null;
  }

  // The response contains at most 20 entries. You can check to see if there are more.
  if (formatBoolean(response.hasMore) === true) {
    console.log('hasMore');
    const nextTransactions = await queryTransactionsFromAppStoreServerAPIWithPreviousResponse(transactionId, response);
    return transactions + areAllDefined(nextTransactions) ? nextTransactions : [];
  }

  console.log('returning transactions', transactions);
  return transactions;
}

module.exports = { queryTransactionsFromAppStoreServerAPI };
