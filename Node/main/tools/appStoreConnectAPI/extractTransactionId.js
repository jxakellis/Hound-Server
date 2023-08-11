// Copyright (c) 2023 Apple Inc. Licensed under MIT License.
// https://github.com/apple/app-store-server-library-node/blob/main/receipt_utility.ts

const { ASN1HEX } = require('jsrsasign');

const IN_APP_TYPE_ID = 17;
const TRANSACTION_IDENTIFIER_TYPE_ID = 1703;
const ORIGINAL_TRANSACTION_IDENTIFIER_TYPE_ID = 1705;

/**
     * Extracts a transaction id from an encoded App Receipt. Throws if the receipt does not match the expected format.
     * *NO validation* is performed on the receipt, and any data returned should only be used to call the App Store Server API.
     * @param appReceipt The unmodified app receipt
     * @returns A transaction id from the array of in-app purchases, null if the receipt contains no in-app purchases
     */
function extractTransactionIdFromAppStoreReceiptURL(appStoreReceiptURL) {
  const receiptInfo = ASN1HEX.getVbyList(Buffer.from(appStoreReceiptURL, 'base64').toString('hex'), 0, [1, 0, 2, 1, 0]);
  let index = 0;
  while (ASN1HEX.getVbyList(receiptInfo, 0, [index, 0])) {
    const receiptInfoVal = ASN1HEX.getVbyList(receiptInfo, 0, [index, 0]);

    if (IN_APP_TYPE_ID === parseInt(receiptInfoVal, 16)) {
      const inAppInfo = ASN1HEX.getVbyList(receiptInfo, 0, [index, 2]);
      let inAppIndex = 0;

      while (ASN1HEX.getVbyList(inAppInfo, 0, [inAppIndex, 0])) {
        const inAppIndexVal = ASN1HEX.getVbyList(inAppInfo, 0, [inAppIndex, 0]);

        if (TRANSACTION_IDENTIFIER_TYPE_ID === parseInt(inAppIndexVal, 16) || ORIGINAL_TRANSACTION_IDENTIFIER_TYPE_ID === parseInt(inAppIndexVal, 16)) {
          const transactionIdUTF8String = ASN1HEX.getVbyList(inAppInfo, 0, [inAppIndex, 2]);
          const transactionId = ASN1HEX.getVbyList(transactionIdUTF8String, 0, []);
          return Buffer.from(transactionId, 'hex').toString();
        }
        inAppIndex += 1;
      }
    }

    index += 1;
  }
  return undefined;
}

module.exports = { extractTransactionIdFromAppStoreReceiptURL };
