const {
  SortParameter, decodeTransactions, decodeRenewalInfo, decodeTransaction,
} = require('app-store-server-api');
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
  if (areAllDefined(transactionId) === false) {
    return null;
  }

  // Query Apple's servers to attempt to get the transaction history linked to a transactionId from an AppStoreReceiptURL
  let response;
  const queryProperties = areAllDefined(previousResponse) && areAllDefined(previousResponse.revision)
    ? {
      sort: SortParameter.Descending,
      // must be undefined, not null
      revision: previousResponse.revision,
    }
    : { sort: SortParameter.Descending };
  try {
    response = await api.getTransactionHistory(transactionId, queryProperties);
  }
  catch (error) {
    logServerError('queryTransactionsFromAppStoreServerAPIWithPreviousResponse getTransactionHistory', error);
    return null;
  }

  if (formatString(response.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return null;
  }

  if (formatString(response.environment) !== global.CONSTANT.SERVER.ENVIRONMENT) {
    return null;
  }

  // Decoding not only reveals the contents of the transactions but also verifies that they were signed by Apple.
  let transactions;
  try {
    transactions = await decodeTransactions(response.signedTransactions);
  }
  catch (error) {
    logServerError('queryTransactionsFromAppStoreServerAPIWithPreviousResponse decodeTransactions', error);
    return null;
  }
  transactions = transactions.filter((transaction) => transaction.type === 'Auto-Renewable Subscription');

  // The response contains at most 20 entries. You can check to see if there are more.
  if (formatBoolean(response.hasMore) === true) {
    const nextTransactions = await queryTransactionsFromAppStoreServerAPIWithPreviousResponse(transactionId, response);
    return transactions.concat(areAllDefined(nextTransactions) ? nextTransactions : []);
  }

  return transactions;
}

/**
 * Queries Apple Store Server API with the transactionId to get all records of subscriptions associated with that transactionId.
 * https://developer.apple.com/documentation/appstoreserverapi/get_all_subscription_statuses
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked subscriptions.
 * @returns An array of [renewalInfo, transactionInfo] linked to the transactionId or null
 */
async function querySubscriptionStatusesFromAppStoreAPI(transactionId) {
  // TODO NOW TEST function
  console.log('\n\n\n', 'querySubscriptionStatusesFromAppStoreAPI', '\n\n\n');
  if (areAllDefined(transactionId) === false) {
    return null;
  }

  console.log('1');

  // Query Apple's servers to attempt to get the subscription history linked to a transactionId from an AppStoreReceiptURL
  // https://developer.apple.com/documentation/appstoreserverapi/statusresponse
  let statusResponse;
  // We can add a status filter(s) to filter subscriptions by their status (e.g. active, expired...), however, for now we get everything.
  try {
    statusResponse = await api.getSubscriptionStatuses(transactionId);
  }
  catch (error) {
    console.log('2e');
    logServerError('querySubscriptionStatusesFromAppStoreAPI getSubscriptionStatuses', error);
    return null;
  }

  const transactions = await queryTransactionsFromAppStoreServerAPI(transactionId);
  console.log('\n\n\n', 'queryTransactionsFromAppStoreServerAPI transactions', transactions, '\n\n\n');

  console.log('2');

  if (formatString(statusResponse.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    console.log('3e');
    return null;
  }

  if (formatString(statusResponse.environment) !== global.CONSTANT.SERVER.ENVIRONMENT) {
    console.log('3ee');
    return null;
  }

  console.log('\n\n\nstatus response', statusResponse, '\n\n\n');

  // We will have a potentially large amount of signedRenewal/TransactionInfos to decode. Therefore, we want to gather them all then do Promise.all.
  const renewalInfoPromises = [];
  const transactionInfoPromises = [];

  // statusResponse.data is an array of SubscriptionGroupIdentifierItem
  const subscriptionGroupIdentifierItems = statusResponse.data;

  console.log('4');

  for (let i = 0; i < subscriptionGroupIdentifierItems.length; i += 1) {
    console.log('i of:', i);
    // https://developer.apple.com/documentation/appstoreserverapi/subscriptiongroupidentifieritem
    // each SubscriptionGroupIdentifierItem has a subscriptionGroupIdentifier and lastTransactionsItem array

    const subscriptionGroupIdentifierItem = subscriptionGroupIdentifierItems[i];
    const lastTransactionsItems = subscriptionGroupIdentifierItem.lastTransactions;
    console.log('subscriptionGroupIdentifier', subscriptionGroupIdentifierItem.subscriptionGroupIdentifier);

    for (let j = 0; j < lastTransactionsItems.length; j += 1) {
      console.log('j of:', j);
      // https://developer.apple.com/documentation/appstoreserverapi/lasttransactionsitem
      // each lastTransactionsItem has an originalTransactionId, status, signedRenewalInfo, and signedTransactionInfo
      const lastTransactionsItem = lastTransactionsItems[j];
      console.log('originalTransactionId', lastTransactionsItem.originalTransactionId);

      renewalInfoPromises.push(decodeRenewalInfo(lastTransactionsItem.signedRenewalInfo));
      transactionInfoPromises.push(decodeTransaction(lastTransactionsItem.signedTransactionInfo));
    }
  }

  console.log('5');

  // Now we have two arrays of promises, await them to get our results
  let decodedRenewalInfos;
  try {
    decodedRenewalInfos = await Promise.all(renewalInfoPromises);
    console.log('decodedRenewalInfos', decodedRenewalInfos);
  }
  catch (error) {
    logServerError('querySubscriptionStatusesFromAppStoreAPI decodeRenewalInfo', error);
    return null;
  }

  console.log('6');

  let decodedTransactionInfos;
  try {
    decodedTransactionInfos = await Promise.all(transactionInfoPromises);
    console.log('decodedTransactionInfos', decodedTransactionInfos);
  }
  catch (error) {
    logServerError('querySubscriptionStatusesFromAppStoreAPI decodeTransaction', error);
    return null;
  }

  console.log('7');

  const combinedResults = decodedRenewalInfos.map((renewalInfo, index) => [renewalInfo, decodedTransactionInfos[index]]);
  console.log('\n\n\n', combinedResults, '\n\n\n');

  return combinedResults;
}

module.exports = { querySubscriptionStatusesFromAppStoreAPI };
