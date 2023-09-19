const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../validate/validateDefined');

// Queries the users and transactions databases with the supplied variables to find and return an associated userId
async function findTransactionOwner(databaseConnection, appAccountToken, transactionId, originalTransactionId) {
  if (areAllDefined(databaseConnection) === false) {
    return undefined;
  }

  const userId = await findTransactionOwnerForAppAccountToken(databaseConnection, appAccountToken)
    ?? await findTransactionOwnerForTransactionIds(databaseConnection, transactionId, originalTransactionId)
    ?? undefined;

  return userId;
}

// Queries the users database to find the userId associated with the appAccountToken
async function findTransactionOwnerForAppAccountToken(databaseConnection, appAccountToken) {
  if (areAllDefined(databaseConnection, appAccountToken) === false) {
    return undefined;
  }

  const [userInformation] = await databaseQuery(
    databaseConnection,
    `SELECT userId 
    FROM users u
    WHERE u.userAppAccountToken = ?
    LIMIT 1`,
    [appAccountToken],
  );

  if (areAllDefined(userInformation) === false) {
    return undefined;
  }

  return userInformation.userId;
}

async function findTransactionOwnerForTransactionIds(databaseConnection, transactionId, originalTransactionId) {
  if (areAllDefined(databaseConnection) === false) {
    return undefined;
  }

  // If the user supplied an originalTransactionId, search with this first to attempt to find the userId for the most recent associated transaction
  if (areAllDefined(originalTransactionId) === true) {
    const [transaction] = await databaseQuery(
      databaseConnection,
      `SELECT userId
        FROM transactions t
        WHERE originalTransactionId = ?
        ORDER BY purchaseDate DESC
        LIMIT 1`,
      [originalTransactionId],
    );

    if (areAllDefined(transaction) === true) {
      return transaction.userId;
    }
  }

  // If the user supplied an transactionId, attempt to find the userId for the most recent associated transaction
  if (areAllDefined(transactionId) === true) {
    const [transaction] = await databaseQuery(
      databaseConnection,
      `SELECT userId
        FROM transactions t
        WHERE transactionId = ?
        ORDER BY purchaseDate DESC
        LIMIT 1`,
      [transactionId],
    );

    if (areAllDefined(transaction) === true) {
      return transaction.userId;
    }
  }

  return undefined;
}

module.exports = { findTransactionOwner };
