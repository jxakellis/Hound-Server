const transactionsColumns = `
t.userId,
t.transactionId,
t.productId,
t.purchaseDate,
t.expiresDate,
t.numberOfFamilyMembers,
t.autoRenewStatus,
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
    numberOfFamilyMembers: number
    autoRenewStatus: number
    autoRenewProductId: string
    revocationReason?: number
    offerIdentifier?: number
    // This row is added manually after a database query. This serves as a flag that can be used client-side to easily determine which subscription is the active one
    isActive?: number
};

export {
  type TransactionsRow,
  transactionsColumns,
};
