// TODO FUTURE depreciate isAutoRenewing, expirationDate, and numberOfDogs (last used 3.0.0)
const transactionsColumns = `
t.userId,
t.transactionId,
t.productId,
t.purchaseDate,
t.expiresDate,
t.expiresDate AS expirationDate,
t.numberOfFamilyMembers,
t.numberOfDogs,
t.autoRenewStatus,
t.autoRenewStatus AS isAutoRenewing,
t.autoRenewProductId,
t.revocationReason,
t.offerIdentifier
`;

type TransactionsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userId: string
    transactionId: number
    productId: string
    purchaseDate: Date
    expiresDate: Date
    expirationDate: Date
    numberOfFamilyMembers: number
    numberOfDogs: number
    autoRenewStatus: number
    isAutoRenewing: number
    autoRenewProductId: string
    revocationReason?: number
    offerIdentifier?: number
    // This row is added manually after a database query. This serves as a flag that can be used client-side to easily determine which subscription is the active one
    isActive?: boolean
};

export {
  TransactionsRow,
  transactionsColumns,
};
