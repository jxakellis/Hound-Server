/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// Copyright (c) 2023 Apple Inc. Licensed under MIT License.
// https://github.com/apple/app-store-server-library-node/blob/main/receipt_utility.ts

import { ASN1HEX } from 'jsrsasign';
import { formatNumber } from '../../format/formatObject.js';

const IN_APP_TYPE_ID = 17;
const TRANSACTION_IDENTIFIER_TYPE_ID = 1703;
const ORIGINAL_TRANSACTION_IDENTIFIER_TYPE_ID = 1705;

/**
     * Extracts a transaction id from an encoded App Receipt. Throws if the receipt does not match the expected format.
     * *NO validation* is performed on the receipt, and any data returned should only be used to call the App Store Server API.
     * @param appReceipt The unmodified app receipt
     * @returns A transaction id from the array of in-app purchases, null if the receipt contains no in-app purchases
     */
function extractTransactionIdFromAppStoreReceiptURL(appStoreReceiptURL: string): number | undefined {
  // Decoding the receipt from base64 to a hex string.
  const receiptInfo = ASN1HEX.getVbyList(Buffer.from(appStoreReceiptURL, 'base64').toString('hex'), 0, [1, 0, 2, 1, 0]);

  if (receiptInfo === null) {
    return undefined;
  }

  let index = 0;
  // Looping through receipt sections using their structure.
  while (ASN1HEX.getVbyList(receiptInfo, 0, [index, 0])) {
    const receiptInfoVal = ASN1HEX.getVbyList(receiptInfo, 0, [index, 0]);

    if (receiptInfoVal === null) {
      return undefined;
    }
    // Check if the current section represents an in-app purchase.
    if (IN_APP_TYPE_ID === parseInt(receiptInfoVal, 16)) {
      const inAppInfo = ASN1HEX.getVbyList(receiptInfo, 0, [index, 2]);
      let inAppIndex = 0;

      if (inAppInfo === null) {
        return undefined;
      }
      // Loop through the in-app purchase details.
      while (ASN1HEX.getVbyList(inAppInfo, 0, [inAppIndex, 0])) {
        const inAppIndexVal = ASN1HEX.getVbyList(inAppInfo, 0, [inAppIndex, 0]);

        if (inAppIndexVal === null) {
          return undefined;
        }
        // Check if the current entry is either a regular transaction ID or an original transaction ID.
        if (TRANSACTION_IDENTIFIER_TYPE_ID === parseInt(inAppIndexVal, 16) || ORIGINAL_TRANSACTION_IDENTIFIER_TYPE_ID === parseInt(inAppIndexVal, 16)) {
          const transactionIdUTF8String = ASN1HEX.getVbyList(inAppInfo, 0, [inAppIndex, 2]);
          if (transactionIdUTF8String === null) {
            return undefined;
          }

          const transactionId = ASN1HEX.getVbyList(transactionIdUTF8String, 0, []);

          if (transactionId === null) {
            return undefined;
          }
          // Convert the hex-encoded transaction ID to a string and return it.
          return formatNumber(Buffer.from(transactionId, 'hex').toString());
        }
        inAppIndex += 1;
      }
    }

    index += 1;
  }
  return undefined;
}

export { extractTransactionIdFromAppStoreReceiptURL };
