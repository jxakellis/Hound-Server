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
  forEnvironment,
  forExpirationDate,
  forInAppOwnershipType,
  forTransactionId,
  forOfferIdentifier,
  forOriginalTransactionId,
  forOfferType,
  forProductId,
  forPurchaseDate,
  forQuantity,
  forSubscriptionGroupIdentifier,
  forTransactionReason,
  forWebOrderLineItemId,
) {
  // TODO NOW TEST that the offer code is recieve from both server and reciept
  console.log(`insertTransactionForTransactionInfo did recieve ${forOfferIdentifier}`);
  // userId
  // familyId

  // https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
  // appAccountToken; A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).
  // The product identifier of the subscription that will renew when the current subscription expires. autoRenewProductId == productId when a subscription is created
  const autoRenewProductId = formatString(forProductId, 60);
  // bundleId; The bundle identifier of the app.
  // The server environment, either sandbox or production.
  const environment = formatString(forEnvironment, 10);
  // The UNIX time, in milliseconds, the subscription expires or renews.
  const expirationDate = formatDate(formatNumber(forExpirationDate));
  // A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.
  const inAppOwnershipType = formatString(forInAppOwnershipType, 13);
  // isAutoRenewing; NOT INCLUDED AT THIS STAGE
  // 1 An introductory offer. 2 A promotional offer. 3 An offer with a subscription offer code.
  const isInIntroductoryPeriod = formatBoolean(formatNumber(forOfferType) === 1);
  // isRevoked; NOT INCLUDED AT THIS STAGE
  // isUpgraded; A Boolean value that indicates whether the user upgraded to another subscription.
  // The identifier that contains the offer code or the promotional offer identifier.
  const offerIdentifier = formatString(forOfferIdentifier, 64);
  // offerType; A value that represents the promotional offer type. The offer types 2 and 3 have an offerIdentifier.
  // originalPurchaseDate; The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.
  // The transaction identifier of the original purchase.
  const originalTransactionId = formatNumber(forOriginalTransactionId);
  // The product identifier of the in-app purchase.
  const productId = formatString(forProductId, 60);
  // The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.
  const purchaseDate = formatDate(formatNumber(forPurchaseDate));
  // The number of consumable products the user purchased.
  const quantity = formatNumber(forQuantity);
  // revocationDate; The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.
  // revocationReason; The reason that the App Store refunded the transaction or revoked it from Family Sharing.
  // signedDate; The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.
  // storefront; The three-letter code that represents the country or region associated with the App Store storefront for the purchase.
  // storefrontId; An Apple-defined value that uniquely identifies the App Store storefront associated with the purchase.
  // The identifier of the subscription group the subscription belongs to.
  const subscriptionGroupIdentifier = formatNumber(forSubscriptionGroupIdentifier);
  // The unique identifier of the transaction.
  const transactionId = formatNumber(forTransactionId);
  // The reason for the purchase transaction, which indicates whether it’s a customer’s purchase or a renewal for an auto-renewable subscription that the system initiates.
  const transactionReason = formatString(forTransactionReason, 8);
  // type; The type of the in-app purchase.
  // The unique identifier of subscription purchase events across devices, including subscription renewals.
  const webOrderLineItemId = formatNumber(forWebOrderLineItemId);

  if (areAllDefined(
    databaseConnection,
    userId,
    familyId,
    autoRenewProductId,
    environment,
    expirationDate,
    inAppOwnershipType,
    isInIntroductoryPeriod,
    // offerIdentifier is optionally defined
    originalTransactionId,
    productId,
    purchaseDate,
    quantity,
    subscriptionGroupIdentifier,
    transactionId,
    transactionReason,
    webOrderLineItemId,
  ) === false) {
    throw new ValidationError(`databaseConnection,
userId, 
familyId, 
autoRenewProductId, 
environment, 
inAppOwnershipType, 
isInIntroductoryPeriod, 
originalTransactionId, 
productId, 
purchaseDate, 
quantity, 
subscriptionGroupIdentifier, 
transactionId, 
transactionReason,
or webOrderLineItemId is missing`, global.CONSTANT.ERROR.VALUE.MISSING);
  }

  if (environment !== global.CONSTANT.SERVER.ENVIRONMENT) {
    throw new ValidationError(`environment must be '${global.CONSTANT.SERVER.ENVIRONMENT}', not '${environment}'`, global.CONSTANT.ERROR.VALUE.INVALID);
  }

  if (inAppOwnershipType !== 'PURCHASED') {
    throw new ValidationError(`inAppOwnershipType must be 'PURCHASED', not '${inAppOwnershipType}'`, global.CONSTANT.ERROR.VALUE.INVALID);
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

  await databaseQuery(
    databaseConnection,
    `INSERT INTO transactions
    (
      userId, familyId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId, environment, expirationDate, inAppOwnershipType,
      isInIntroductoryPeriod, offerIdentifier, originalTransactionId, productId,
      purchaseDate, quantity, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId
    )
    VALUES
    (
      ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, 
      ?, ?, ?, ?,
      ?, ?
    )`,
    [
      userId, familyId,
      numberOfFamilyMembers, numberOfDogs,
      autoRenewProductId, environment, expirationDate, inAppOwnershipType,
      isInIntroductoryPeriod, offerIdentifier, originalTransactionId, productId,
      purchaseDate, quantity, subscriptionGroupIdentifier, transactionId,
      transactionReason, webOrderLineItemId,
    ],
  );
}

module.exports = { insertTransactionForTransactionInfo };
