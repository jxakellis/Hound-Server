const { ValidationError } = require('../../main/tools/general/errors');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const {
  formatBoolean, formatSHA256Hash, formatString,
} = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { createFamilyMemberJoinNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');
const { getAllFamilyMembersForFamilyId, getFamilyMemberUserIdForUserId } = require('../getFor/getForFamily');
const { getActiveInAppSubscriptionForFamilyId } = require('../getFor/getForInAppSubscriptions');

const { createFamilyLockedNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');

/**
 *  Queries the database to update a family to add a new user. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateFamilyForUserIdFamilyId(databaseConnection, userId, familyId, forFamilyCode, forIsLocked) {
  const familyCode = formatString(forFamilyCode);
  const familyIsLocked = formatBoolean(forIsLocked);
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.constant.error.value.MISSING);
  }

  // familyId doesn't exist, so user must want to join a family
  if (areAllDefined(familyId) === false && areAllDefined(familyCode)) {
    await addFamilyMember(databaseConnection, userId, familyCode);
  }
  else if (areAllDefined(familyIsLocked)) {
    await updateIsLocked(databaseConnection, userId, familyId, familyIsLocked);
  }
  else {
    throw new ValidationError('No value provided', global.constant.error.value.MISSING);
  }
}

/**
 * Helper method for createFamilyForUserId, goes through checks to attempt to add user to desired family
 */
async function addFamilyMember(databaseConnection, userId, forFamilyCode) {
  // make sure familyCode was provided
  let familyCode = formatString(forFamilyCode);

  if (areAllDefined(databaseConnection, userId, familyCode) === false) {
    throw new ValidationError('databaseConnection, userId, or familyCode missing', global.constant.error.value.MISSING);
  }
  familyCode = familyCode.toUpperCase();

  // retrieve information about the family linked to the familyCode
  let family = await databaseQuery(
    databaseConnection,
    'SELECT familyId, familyIsLocked FROM families WHERE familyCode = ? LIMIT 1',
    [familyCode],
  );

  // make sure the familyCode was valid by checking if it matched a family
  if (family.length === 0) {
    // result length is zero so there are no families with that familyCode
    throw new ValidationError('familyCode invalid, not found', global.constant.error.family.join.FAMILY_CODE_INVALID);
  }
  [family] = family;
  const familyId = formatSHA256Hash(family.familyId);
  const familyIsLocked = formatBoolean(family.familyIsLocked);
  // familyCode exists and is linked to a family, now check if family is locked against new members
  if (familyIsLocked) {
    throw new ValidationError('Family is locked', global.constant.error.family.join.FAMILY_LOCKED);
  }

  // the familyCode is valid and linked to an UNLOCKED family

  const isFamilyMember = await getFamilyMemberUserIdForUserId(databaseConnection, userId);

  if (isFamilyMember.length !== 0) {
    // user is already in a family
    throw new ValidationError('You are already in a family', global.constant.error.family.join.IN_FAMILY_ALREADY);
  }

  // Don't use .familyActiveSubscription property: the property wasn't assigned to the request due to the user not being in a family (only assigned with familyId is path param)
  const familyActiveSubscription = await getActiveInAppSubscriptionForFamilyId(databaseConnection, familyId);
  const familyMembers = await getAllFamilyMembersForFamilyId(databaseConnection, familyId);

  // the family is either at the limit of family members is exceeds the limit, therefore no new users can join
  if (familyMembers.length >= familyActiveSubscription.numberOfFamilyMembers) {
    throw new ValidationError(`Family member limit of ${familyActiveSubscription.numberOfFamilyMembers} exceeded`, global.constant.error.family.limit.FAMILY_MEMBER_TOO_LOW);
  }

  // familyCode validated and user is not a family member in any family
  // insert the user into the family as a family member.
  await databaseQuery(
    databaseConnection,
    'INSERT INTO familyMembers(userId, familyId, familyMemberJoinDate) VALUES (?, ?, ?)',
    [userId, familyId, new Date()],
  );

  createFamilyMemberJoinNotification(userId, family.familyId);
}

/**
 * Helper method for updateFamilyForFamilyId, switches the family familyIsLocked status
 */
async function updateIsLocked(databaseConnection, userId, familyId, forIsLocked) {
  const familyIsLocked = formatBoolean(forIsLocked);

  if (areAllDefined(databaseConnection, userId, familyId, familyIsLocked) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or familyIsLocked missing', global.constant.error.value.MISSING);
  }

  await databaseQuery(
    databaseConnection,
    'UPDATE families SET familyIsLocked = ? WHERE familyId = ?',
    [familyIsLocked, familyId],
  );

  createFamilyLockedNotification(userId, familyId, familyIsLocked);
}

module.exports = { updateFamilyForUserIdFamilyId };
