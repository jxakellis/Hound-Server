import {
  SortParameter, decodeTransactions, decodeRenewalInfo, decodeTransaction, type HistoryResponse, type JWSTransactionDecodedPayload, type StatusResponse, type JWSRenewalInfoDecodedPayload,
} from 'app-store-server-api';
import { api } from './api.js';
import { logServerError } from '../../logging/logServerError.js';
import { formatUnknownString, formatBoolean } from '../../format/formatObject.js';
import { SERVER } from '../../server/globalConstants.js';
import { HoundError } from '../../server/globalErrors.js';

/**
 * Internal function.
 * Queries Apple Store Server API with the transactionId to get all records of transactions associated with that transactionId. DESC from most recently to oldest.
 * https://github.com/agisboye/app-store-server-api
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked transactions.
 * @param {*} previousResponse The previousResponse from a previous invocation of queryTransactionHistoryFromAppStoreServerAPI, used internally for response.hasMore
 * @returns [ { ...transactionInfo } ] of all transactions linked to transactionId or []
 */
async function queryTransactionHistoryFromAppStoreServerAPI(transactionId: string, revision?: string): Promise<{ transactionInfo: JWSTransactionDecodedPayload}[]> {
  // Query Apple's servers to attempt to get the transaction history linked to a transactionId from an AppStoreReceiptURL
  let response: HistoryResponse;
  try {
    // If we have no revision, it must be completely excluded from the body
    response = await api.getTransactionHistory(transactionId, revision !== undefined && revision !== null
      ? {
        sort: SortParameter.Descending,
        revision,
      }
      : {
        sort: SortParameter.Descending,
      });
  }
  catch (error) {
    logServerError(
      new HoundError(
        'getTransactionHistory',
        queryTransactionHistoryFromAppStoreServerAPI,
        undefined,
        error,
      ),
    );
    return [];
  }

  if (response.bundleId !== SERVER.APP_BUNDLE_ID) {
    return [];
  }

  if (response.environment !== SERVER.ENVIRONMENT) {
    return [];
  }

  // Decoding not only reveals the contents of the transactions but also verifies that they were signed by Apple.
  let transactions: { transactionInfo: JWSTransactionDecodedPayload}[];
  try {
    transactions = (await decodeTransactions(response.signedTransactions)).map((transactionInfo) => ({ transactionInfo }));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'decodeTransactions',
        queryTransactionHistoryFromAppStoreServerAPI,
        undefined,
        error,
      ),
    );
    return [];
  }

  // Only include transactions that are subscriptions
  transactions = transactions.filter((transaction) => transaction.transactionInfo.type === 'Auto-Renewable Subscription');

  // The response contains at most 20 entries. You can check to see if there are more.
  if (formatBoolean(response.hasMore) === true) {
    const nextTransactions: { transactionInfo: JWSTransactionDecodedPayload}[] = await queryTransactionHistoryFromAppStoreServerAPI(transactionId, response.revision);
    transactions = transactions.concat(nextTransactions);
    return transactions;
  }

  return transactions;
}

/**
 * Internal function.
 * Queries Apple Store Server API with the transactionId to get all records of subscriptions associated with that transactionId.
 * NOTE: It appears this endpoint only returns ONE subscription (the most recent one).
 * https://developer.apple.com/documentation/appstoreserverapi/get_all_subscription_statuses
 * @param {*} transactionId The transactionId used to query Apple's servers to find linked subscriptions.
 * @returns [ { ...transactionInfo, ...renewalInfo } ] of all subscriptions linked to the transactionId or []
 */
async function querySubscriptionStatusesFromAppStoreAPI(transactionId: string): Promise<{ transactionInfo: JWSTransactionDecodedPayload; renewalInfo: JWSRenewalInfoDecodedPayload }[]> {
  // Query Apple's servers to attempt to get the subscription history linked to a transactionId from an AppStoreReceiptURL
  // https://developer.apple.com/documentation/appstoreserverapi/statusresponse
  let statusResponse: StatusResponse;
  // We can add a status filter(s) to filter subscriptions by their status (e.g. active, expired...), however, for now we get everything.
  try {
    statusResponse = await api.getSubscriptionStatuses(transactionId);
  }
  catch (error) {
    logServerError(
      new HoundError(
        'getSubscriptionStatuses',
        querySubscriptionStatusesFromAppStoreAPI,
        undefined,
        error,
      ),
    );
    return [];
  }

  if (formatUnknownString(statusResponse.bundleId) !== SERVER.APP_BUNDLE_ID) {
    return [];
  }

  if (formatUnknownString(statusResponse.environment) !== SERVER.ENVIRONMENT) {
    return [];
  }

  // We will have a potentially large amount of signedRenewal/TransactionInfos to decode. Therefore, we want to gather them all then do Promise.all.
  const transactionInfoPromises: Promise<JWSTransactionDecodedPayload>[] = [];
  const renewalInfoPromises: Promise<JWSRenewalInfoDecodedPayload>[] = [];

  // statusResponse.data is an array of SubscriptionGroupIdentifierItem
  const subscriptionGroupIdentifierItems = statusResponse.data;

  subscriptionGroupIdentifierItems.forEach((subscriptionGroupIdentifierItem) => {
    // https://developer.apple.com/documentation/appstoreserverapi/subscriptiongroupidentifieritem
    // each SubscriptionGroupIdentifierItem has a subscriptionGroupIdentifier and lastTransactionsItem array
    const lastTransactionsItems = subscriptionGroupIdentifierItem.lastTransactions;

    lastTransactionsItems.forEach((lastTransactionsItem) => {
      // https://developer.apple.com/documentation/appstoreserverapi/lasttransactionsitem
      // each lastTransactionsItem has an originalTransactionId, status, signedRenewalInfo, and signedTransactionInfo

      transactionInfoPromises.push(decodeTransaction(lastTransactionsItem.signedTransactionInfo));
      renewalInfoPromises.push(decodeRenewalInfo(lastTransactionsItem.signedRenewalInfo));
    });
  });

  // Now we have two arrays of promises, await them to get our results
  let decodedTransactionInfos: JWSTransactionDecodedPayload[] = [];
  try {
    decodedTransactionInfos = decodedTransactionInfos.concat(await Promise.all(transactionInfoPromises));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'decodeTransaction',
        querySubscriptionStatusesFromAppStoreAPI,
        undefined,
        error,
      ),
    );
    return [];
  }

  let decodedRenewalInfos: JWSRenewalInfoDecodedPayload[] = [];
  try {
    decodedRenewalInfos = decodedRenewalInfos.concat(await Promise.all(renewalInfoPromises));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'decodeRenewalInfo',
        querySubscriptionStatusesFromAppStoreAPI,
        undefined,
        error,
      ),
    );
    return [];
  }

  // Combines renewalInfo with a transactionInfo (allowing renewalInfo to override) into one key-value object
  const results: { transactionInfo: JWSTransactionDecodedPayload; renewalInfo: JWSRenewalInfoDecodedPayload }[] = decodedTransactionInfos.map(
    (transactionInfo, index) => ({
      transactionInfo,
      renewalInfo: decodedRenewalInfos[index],
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
async function queryAllSubscriptionsForTransactionId(transactionId: string): Promise<{transactionInfo: JWSTransactionDecodedPayload, renewalInfo?: JWSRenewalInfoDecodedPayload | undefined}[]> {
  // Get all transactions linked to the given transactionId.
  const transactions: {
    transactionInfo: JWSTransactionDecodedPayload,
    renewalInfo?: JWSRenewalInfoDecodedPayload,
}[] = await queryTransactionHistoryFromAppStoreServerAPI(transactionId);

  const randomSingleTransaction = transactions.safeIndex(0);

  // If there are no transactions, return an empty array.
  if (randomSingleTransaction === undefined || randomSingleTransaction === null) {
    return [];
  }

  // Use the transactionId of the first transaction to query the subscription status.
  const subscriptions = await querySubscriptionStatusesFromAppStoreAPI(randomSingleTransaction.transactionInfo.transactionId);

  if (subscriptions.length === 0) {
    return transactions;
  }

  // We were able to retrieve some subscriptions, link them back to our transactions array and add in their properties
  subscriptions.forEach((subscription) => {
    const subscriptionTransactionId = subscription.transactionInfo.transactionId;
    // Find the index of the corresponding transaction in the original transactions array.
    const subscriptionTransactionIndex = transactions.findIndex((transaction) => transaction.transactionInfo.transactionId === subscriptionTransactionId);

    // If we got an index, that means that there is a record in transitions for the subscription's transactionId.
    if (subscriptionTransactionIndex !== -1) {
      transactions[subscriptionTransactionIndex].renewalInfo = subscription.renewalInfo;
    }
  });

  return transactions;
}

export { queryAllSubscriptionsForTransactionId };
