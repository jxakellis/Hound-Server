const appStoreServerNotificationsColumns = `
assn.notificationType,
assn.subtype,
assn.notificationUUID,
assn.version,
assn.signedDate,
assn.dataAppAppleId,
assn.dataBundleId,
assn.dataBundleVersion,
assn.dataEnvironment,
assn.dataStatus,
assn.renewalInfoAutoRenewProductId,
assn.renewalInfoAutoRenewStatus,
assn.renewalInfoEnvironment,
assn.renewalInfoExpirationIntent,
assn.renewalInfoGracePeriodExpiresDate,
assn.renewalInfoIsInBillingRetryPeriod,
assn.renewalInfoOfferIdentifier,
assn.renewalInfoOfferType,
assn.renewalInfoOriginalTransactionId,
assn.renewalInfoPriceIncreaseStatus,
assn.renewalInfoProductId,
assn.renewalInfoRecentSubscriptionStartDate,
assn.renewalInfoRenewalDate,
assn.renewalInfoSignedDate,
assn.transactionInfoAppAccountToken,
assn.transactionInfoBundleId,
assn.transactionInfoEnvironment,
assn.transactionInfoExpiresDate,
assn.transactionInfoInAppOwnershipType,
assn.transactionInfoIsUpgraded,
assn.transactionInfoOfferIdentifier,
assn.transactionInfoOfferType,
assn.transactionInfoOriginalPurchaseDate,
assn.transactionInfoOriginalTransactionId,
assn.transactionInfoProductId,
assn.transactionInfoPurchaseDate,
assn.transactionInfoQuantity,
assn.transactionInfoRevocationDate,
assn.transactionInfoRevocationReason,
assn.transactionInfoSignedDate,
assn.transactionInfoSubscriptionGroupIdentifier,
assn.transactionInfoTransactionId,
assn.transactionInfoType,
assn.transactionInfoWebOrderLineItemId
`;

type AppStoreServerNotificationsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    notificationType?: string,
    subtype?: string,
    notificationUUID: string,
    version?: string,
    signedDate?: Date,
    dataAppAppleId?: string,
    dataBundleId?: string,
    dataBundleVersion?: number,
    dataEnvironment?: string,
    dataStatus?: number,
    renewalInfoAutoRenewProductId?: string,
    renewalInfoAutoRenewStatus?: number,
    renewalInfoEnvironment?: string,
    renewalInfoExpirationIntent?: number,
    renewalInfoGracePeriodExpiresDate?: Date,
    renewalInfoIsInBillingRetryPeriod?: number,
    renewalInfoOfferIdentifier?: string,
    renewalInfoOfferType?: number,
    renewalInfoOriginalTransactionId?: number,
    renewalInfoPriceIncreaseStatus?: number,
    renewalInfoProductId?: string,
    renewalInfoRecentSubscriptionStartDate?: Date,
    renewalInfoRenewalDate?: Date,
    renewalInfoSignedDate?: Date,
    transactionInfoAppAccountToken?: string,
    transactionInfoBundleId?: string,
    transactionInfoEnvironment?: string,
    transactionInfoExpiresDate: Date,
    transactionInfoInAppOwnershipType?: string,
    transactionInfoIsUpgraded?: number,
    transactionInfoOfferIdentifier?: string,
    transactionInfoOfferType?: number,
    transactionInfoOriginalPurchaseDate?: Date,
    transactionInfoOriginalTransactionId?: number,
    transactionInfoProductId?: string,
    transactionInfoPurchaseDate?: Date,
    transactionInfoQuantity: number,
    transactionInfoRevocationDate?: Date,
    transactionInfoRevocationReason: number,
    transactionInfoSignedDate?: Date,
    transactionInfoSubscriptionGroupIdentifier?: number,
    transactionInfoTransactionId?: number,
    transactionInfoType?: string,
    transactionInfoWebOrderLineItemId?: number,
};

export { AppStoreServerNotificationsRow, appStoreServerNotificationsColumns };
