const { decodeRenewalInfo, decodeTransaction } = require('app-store-server-api');
const { api } = require('./api');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');
const { formatString } = require('../format/formatObject');

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
