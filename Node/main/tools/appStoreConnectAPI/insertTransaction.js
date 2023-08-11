const { databaseQuery } = require('../database/databaseQuery');
const {
  formatDate, formatNumber, formatString, formatBoolean,
} = require('../format/formatObject');
const { areAllDefined } = require('../validate/validateDefined');
const { ValidationError } = require('../general/errors');

const { getFamilyHeadUserIdForFamilyId } = require('../../../controllers/getFor/getForFamily');

async function insertTransactionForTransactionInfo(
  databaseConnection,
  userId,
  familyId,
  forTransactionId,
  forOriginalTransactionId,
  forEnvironment,
  forProductId,
  forSubscriptionGroupIdentifier,
  forPurchaseDateMS,
  forExpirationDateMS,
  forQuantity,
  forWebOrderLineItemId,
  forInAppOwnershipType,
  forIsInIntroductoryPeriod,
  forOfferCode,
) {
  // TODO NOW TEST that the offer code is recieve from both server and reciept
  console.log(`insertTransactionForTransactionInfo did recieve ${forOfferCode}`);
  // userId
  // familyId
  const transactionId = formatNumber(forTransactionId);
  const originalTransactionId = formatNumber(forOriginalTransactionId);
  const environment = formatString(forEnvironment, 10);
  const productId = formatString(forProductId, 60);
  const subscriptionGroupIdentifier = formatNumber(forSubscriptionGroupIdentifier);
  const purchaseDate = formatDate(formatNumber(forPurchaseDateMS));
  const expirationDate = formatDate(formatNumber(forExpirationDateMS));
  const quantity = formatNumber(forQuantity);
  const webOrderLineItemId = formatNumber(forWebOrderLineItemId);
  const inAppOwnershipType = formatString(forInAppOwnershipType, 13);
  // autoRenewProductId == productId when a subscription is created
  const autoRenewProductId = formatString(forProductId, 60);
  const isInIntroductoryPeriod = formatBoolean(forIsInIntroductoryPeriod);
  const offerCode = formatString(forOfferCode, 64);

  if (areAllDefined(
    databaseConnection,
    userId,
    familyId,
    transactionId,
    originalTransactionId,
    environment,
    productId,
    subscriptionGroupIdentifier,
    purchaseDate,
    expirationDate,
    quantity,
    webOrderLineItemId,
    inAppOwnershipType,
    autoRenewProductId,
    isInIntroductoryPeriod,
    // offerCode doesn't have to be defined
  ) === false) {
    throw new ValidationError(`databaseConnection,
userId,
familyId,
transactionId, 
originalTransactionId, 
environment, 
productId, 
subscriptionGroupIdentifier, 
purchaseDate, 
expirationDate, 
quantity, 
webOrderLineItemId, 
inAppOwnershipType,
autoRenewProductId,
or isInIntroductoryPeriod missing`, global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const correspondingProduct = global.CONSTANT.SUBSCRIPTION.SUBSCRIPTIONS.find((subscription) => subscription.productId === productId);

  if (areAllDefined(correspondingProduct) === false) {
    throw new ValidationError('correspondingProduct missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const { numberOfFamilyMembers, numberOfDogs } = correspondingProduct;

  if (areAllDefined(numberOfFamilyMembers, numberOfDogs) === false) {
    throw new ValidationError('numberOfFamilyMembers or numberOfDogs missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can modify the family subscription', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  if (inAppOwnershipType !== 'PURCHASED') {
    throw new ValidationError(`inAppOwnershipType must be PURCHASED, not ${inAppOwnershipType}`, global.CONSTANT.ERROR.VALUE.INVALID);
  }

  /*
  transactionId
  originalTransactionId
  userId
  familyId
  environment
  productId
  subscriptionGroupIdentifier
  purchaseDate
  expirationDate
  numberOfFamilyMembers
  numberOfDogs
  quantity
  webOrderLineItemId
  inAppOwnershipType
  NOT INCLUDED AT THIS STAGE isAutoRenewing
  autoRenewProductId
  isInIntroductoryPeriod
  NOT INCLUDED AT THIS STAGE isRevoked
  offerCode
  */
  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (transactionId, originalTransactionId, userId, familyId, environment, productId, 
    subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, 
    numberOfDogs, quantity, webOrderLineItemId, inAppOwnershipType, autoRenewProductId, isInIntroductoryPeriod, offerCode) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      originalTransactionId,
      userId,
      familyId,
      environment,
      productId,
      subscriptionGroupIdentifier,
      purchaseDate,
      expirationDate,
      numberOfFamilyMembers,
      numberOfDogs,
      quantity,
      webOrderLineItemId,
      inAppOwnershipType,
      autoRenewProductId,
      isInIntroductoryPeriod,
      offerCode,
    ],
  );
}

module.exports = { insertTransactionForTransactionInfo };
