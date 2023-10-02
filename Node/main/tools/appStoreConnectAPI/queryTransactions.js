const {
  SortParameter, decodeTransactions, decodeRenewalInfo, decodeTransaction,
} = require('app-store-server-api');
const { api } = require('./api');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');
const { formatString, formatBoolean, formatNumber } = require('../format/formatObject');

/**
 * Internal function.
 * Queries Apple Store Server API with the transactionId to get all records of transactions associated with that transactionId. DESC from most recently to oldest.
 * https://github.com/agisboye/app-store-server-api
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked transactions.
 * @param {*} previousResponse The previousResponse from a previous invocation of queryTransactionHistoryFromAppStoreServerAPI, used internally for response.hasMore
 * @returns [ { ...transactionInfo } ] of all transactions linked to transactionId or []
 */
async function queryTransactionHistoryFromAppStoreServerAPI(transactionId, previousResponse) {
  if (areAllDefined(transactionId) === false) {
    return [];
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
    logServerError('queryTransactionHistoryFromAppStoreServerAPI getTransactionHistory', error);
    return [];
  }

  if (formatString(response.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return [];
  }

  if (formatString(response.environment) !== global.CONSTANT.SERVER.ENVIRONMENT) {
    return [];
  }

  // Decoding not only reveals the contents of the transactions but also verifies that they were signed by Apple.
  let transactions;
  try {
    transactions = await decodeTransactions(response.signedTransactions);
  }
  catch (error) {
    logServerError('queryTransactionHistoryFromAppStoreServerAPI decodeTransactions', error);
    return [];
  }

  // Only include transactions that are subscriptions
  transactions = transactions.filter((transaction) => transaction.type === 'Auto-Renewable Subscription');

  // The response contains at most 20 entries. You can check to see if there are more.
  if (formatBoolean(response.hasMore) === true) {
    const nextTransactions = await queryTransactionHistoryFromAppStoreServerAPI(transactionId, response);
    return transactions.concat(nextTransactions);
  }

  return transactions;
}

/**
 * Internal function.
 * Queries Apple Store Server API with the transactionId to get all records of subscriptions associated with that transactionId.
 * NOTE: It appears this endpoint only returns ONE subscription (the most recent one).
 * https://developer.apple.com/documentation/appstoreserverapi/get_all_subscription_statuses
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked subscriptions.
 * @returns [ { ...transactionInfo, ...renewalInfo } ] of all subscriptioned linked to the transactionId or []
 */
async function querySubscriptionStatusesFromAppStoreAPI(transactionId) {
  if (areAllDefined(transactionId) === false) {
    return [];
  }

  // Query Apple's servers to attempt to get the subscription history linked to a transactionId from an AppStoreReceiptURL
  // https://developer.apple.com/documentation/appstoreserverapi/statusresponse
  let statusResponse;
  // We can add a status filter(s) to filter subscriptions by their status (e.g. active, expired...), however, for now we get everything.
  try {
    statusResponse = await api.getSubscriptionStatuses(transactionId);
  }
  catch (error) {
    logServerError('querySubscriptionStatusesFromAppStoreAPI getSubscriptionStatuses', error);
    return [];
  }
  if (formatString(statusResponse.bundleId) !== global.CONSTANT.SERVER.APP_BUNDLE_ID) {
    return [];
  }

  if (formatString(statusResponse.environment) !== global.CONSTANT.SERVER.ENVIRONMENT) {
    return [];
  }

  // We will have a potentially large amount of signedRenewal/TransactionInfos to decode. Therefore, we want to gather them all then do Promise.all.
  const renewalInfoPromises = [];
  const transactionInfoPromises = [];

  // statusResponse.data is an array of SubscriptionGroupIdentifierItem
  const subscriptionGroupIdentifierItems = statusResponse.data;

  for (let i = 0; i < subscriptionGroupIdentifierItems.length; i += 1) {
    // https://developer.apple.com/documentation/appstoreserverapi/subscriptiongroupidentifieritem
    // each SubscriptionGroupIdentifierItem has a subscriptionGroupIdentifier and lastTransactionsItem array

    const subscriptionGroupIdentifierItem = subscriptionGroupIdentifierItems[i];
    const lastTransactionsItems = subscriptionGroupIdentifierItem.lastTransactions;

    for (let j = 0; j < lastTransactionsItems.length; j += 1) {
      // https://developer.apple.com/documentation/appstoreserverapi/lasttransactionsitem
      // each lastTransactionsItem has an originalTransactionId, status, signedRenewalInfo, and signedTransactionInfo
      const lastTransactionsItem = lastTransactionsItems[j];

      renewalInfoPromises.push(decodeRenewalInfo(lastTransactionsItem.signedRenewalInfo));
      transactionInfoPromises.push(decodeTransaction(lastTransactionsItem.signedTransactionInfo));
    }
  }

  // Now we have two arrays of promises, await them to get our results
  let decodedRenewalInfos;
  try {
    decodedRenewalInfos = await Promise.all(renewalInfoPromises);
  }
  catch (error) {
    logServerError('querySubscriptionStatusesFromAppStoreAPI decodeRenewalInfo', error);
    return [];
  }

  let decodedTransactionInfos;
  try {
    decodedTransactionInfos = await Promise.all(transactionInfoPromises);
  }
  catch (error) {
    logServerError('querySubscriptionStatusesFromAppStoreAPI decodeTransaction', error);
    return [];
  }

  // Combines renewalInfo with a transactionInfo (allowing renewalInfo to override) into one key-value object
  const results = decodedRenewalInfos.map(
    (renewalInfo, index) => ({
      ...decodedTransactionInfos[index],
      ...renewalInfo,
    }),
  );

  return results;
}

/**
 * Queries Apple Store Server API with the transactionId to get all records of transactions associated with that transactionId. DESC from most recently to oldest.
 * Always includes all the transactionInfo for a given transaction, however only includes renewalInfo for the most recent transaction.
 * https://github.com/agisboye/app-store-server-api
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked transactions.
 * @returns [ { ...renewalInfo, ...transactionInfo } ] of all transactions linked to transactionId or [].
 */
async function queryAllSubscriptionsForTransactionId(transactionId) {
  // Get all transactions linked to the given transactionId.
  const transactions = await queryTransactionHistoryFromAppStoreServerAPI(transactionId);

  // If there are no transactions, return an empty array.
  if (areAllDefined(transactions) === false || transactions.length === 0) {
    return [];
  }

  // Use the transactionId of the first transaction to query the subscription status.
  const subscriptions = await querySubscriptionStatusesFromAppStoreAPI(transactions[0].transactionId);

  if (areAllDefined(subscriptions) === false || subscriptions.length === 0) {
    return transactions;
  }

  // We were able to retrieve some subscriptions, link them back to our transactions array and add in their properties
  subscriptions.forEach((subscription) => {
    const subscriptionTransactionId = formatNumber(subscription.transactionId);
    // Find the index of the corresponding transaction in the original transactions array.
    const subscriptionTransactionIndex = transactions.findIndex((transaction) => formatNumber(transaction.transactionId) === subscriptionTransactionId);

    // If we got an index, that means that there is a record in transations for the subscription's transactionId.
    if (subscriptionTransactionIndex !== -1) {
      // Spread in the new properties to the matched transaction
      transactions[subscriptionTransactionIndex] = {
        ...subscription,
        ...transactions[subscriptionTransactionIndex],
      };
    }
  });

  return transactions;
}

module.exports = { queryAllSubscriptionsForTransactionId };
