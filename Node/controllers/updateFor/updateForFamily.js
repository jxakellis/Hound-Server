const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean, formatSHA256Hash, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');
const { createFamilyMemberJoinNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');

const { getAllFamilyMembersForFamilyId, isUserIdInFamily } = require('../getFor/getForFamily');
const { getActiveTransaction } = require('../getFor/getForTransactions');

const { createFamilyLockedNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');

// TODO NOW add logic for a family to allow it to switch family heads. this will mean checking the active subscription to make sure it is not renewing, similar to deleting a family.
// ^^ also check other logic, since in the past a family always had the same userId for its family head, but now that could switch, so verify that functions are compatible with that (e.g. retrieving transactions, reassigning transctions, transaction metrics)

/**
 *  Queries the database to update a family to add a new user. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateFamilyForUserIdFamilyId(databaseConnection, userId, familyId, forFamilyCode, forIsLocked) {
  const familyCode = formatString(forFamilyCode);
  const familyIsLocked = formatBoolean(forIsLocked);
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // familyId doesn't exist, so user must want to join a family
  if (areAllDefined(familyId) === false && areAllDefined(familyCode)) {
    await addFamilyMember(databaseConnection, userId, familyCode);
  }
  else if (areAllDefined(familyIsLocked)) {
    await updateIsLocked(databaseConnection, userId, familyId, familyIsLocked);
  }
  else {
    throw new ValidationError('No value provided', global.CONSTANT.ERROR.VALUE.MISSING);
  }
}

/**
 * Helper method for createFamilyForUserId, goes through checks to attempt to add user to desired family
 */
async function addFamilyMember(databaseConnection, userId, forFamilyCode) {
  // make sure familyCode was provided
  let familyCode = formatString(forFamilyCode);

  if (areAllDefined(databaseConnection, userId, familyCode) === false) {
    throw new ValidationError('databaseConnection, userId, or familyCode missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  familyCode = familyCode.toUpperCase();

  // retrieve information about the family linked to the familyCode
  const [family] = await databaseQuery(
    databaseConnection,
    `SELECT familyId, familyIsLocked
    FROM families f
    WHERE familyCode = ?
    LIMIT 1`,
    [familyCode],
  );

  // make sure the familyCode was valid by checking if it matched a family
  if (areAllDefined(family) === false) {
    // result length is zero so there are no families with that familyCode
    throw new ValidationError('familyCode invalid, not found', global.CONSTANT.ERROR.FAMILY.JOIN.FAMILY_CODE_INVALID);
  }
  const familyId = formatSHA256Hash(family.familyId);
  const familyIsLocked = formatBoolean(family.familyIsLocked);
  // familyCode exists and is linked to a family, now check if family is locked against new members
  if (familyIsLocked) {
    throw new ValidationError('Family is locked', global.CONSTANT.ERROR.FAMILY.JOIN.FAMILY_LOCKED);
  }

  // the familyCode is valid and linked to an UNLOCKED family
  const isUserInFamily = await isUserIdInFamily(databaseConnection, userId);

  if (isUserInFamily === true) {
    // user is already in a family
    throw new ValidationError('You are already in a family', global.CONSTANT.ERROR.FAMILY.JOIN.IN_FAMILY_ALREADY);
  }

  // Don't use .familyActiveSubscription property: the property wasn't assigned to the request due to the user not being in a family (only assigned with familyId is path param)
  const familyActiveSubscription = await getActiveTransaction(databaseConnection, familyId);
  const familyMembers = await getAllFamilyMembersForFamilyId(databaseConnection, familyId);

  // the family is either at the limit of family members is exceeds the limit, therefore no new users can join
  if (familyMembers.length >= familyActiveSubscription.numberOfFamilyMembers) {
    throw new ValidationError(`Family member limit of ${familyActiveSubscription.numberOfFamilyMembers} exceeded`, global.CONSTANT.ERROR.FAMILY.LIMIT.FAMILY_MEMBER_TOO_LOW);
  }

  // familyCode validated and user is not a family member in any family
  // insert the user into the family as a family member.
  await databaseQuery(
    databaseConnection,
    `INSERT INTO familyMembers
    (userId, familyId, familyMemberJoinDate)
    VALUES (?, ?, CURRENT_TIMESTAMP())`,
    [userId, familyId],
  );

  const { offerCode, transactionId } = familyActiveSubscription;

  if (areAllDefined(offerCode, transactionId) === true) {
    // A new family member joined a family with a subscription that has an offer code, insert record into affiliate program table
    await databaseQuery(
      databaseConnection,
      `INSERT INTO affiliateTransactions
      (transactionId, originalTransactionId, userId, familyId, environment, productId, 
      subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, numberOfDogs, 
      quantity, webOrderLineItemId, inAppOwnershipType, isAutoRenewing, autoRenewProductId, isRevoked, offerCode)
      SELECT transactionId, originalTransactionId, userId, familyId, environment, productId, 
      subscriptionGroupIdentifier, purchaseDate, expirationDate, numberOfFamilyMembers, numberOfDogs, 
      quantity, webOrderLineItemId, inAppOwnershipType, isAutoRenewing, autoRenewProductId, isRevoked, offerCode
      FROM transactions t
      WHERE transactionId = ?
      LIMIT 1`,
      [transactionId],
    );
  }

  createFamilyMemberJoinNotification(userId, family.familyId);
}

/**
 * Helper method for updateFamilyForFamilyId, switches the family familyIsLocked status
 */
async function updateIsLocked(databaseConnection, userId, familyId, forIsLocked) {
  const familyIsLocked = formatBoolean(forIsLocked);

  if (areAllDefined(databaseConnection, userId, familyId, familyIsLocked) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or familyIsLocked missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    `UPDATE families
    SET familyIsLocked = ?
    WHERE familyId = ?`,
    [familyIsLocked, familyId],
  );

  createFamilyLockedNotification(userId, familyId, familyIsLocked);
}

module.exports = { updateFamilyForUserIdFamilyId };
