const { ValidationError } = require('../../main/tools/general/errors');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatSHA256Hash } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { getUserFirstNameLastNameForUserId } = require('../getFor/getForUser');
const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

const { createUserKickedNotification } = require('../../main/tools/notifications/alert/createUserKickedNotification');
const { createFamilyMemberLeaveNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');

// TO DO NOW TEST that user can still delete family (make sure auto-renewing and family member checks work)
// TO DO NOW TEST that user can still leave family
// TO DO NOW TEST that user can still be kicked from family

/**
*  Depending on whether the user is a family member or a family head,
*  queries the database to remove the user from their current family or delete the family.
*/
async function deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, userId, familyId, familyActiveSubscription) {
  // familyKickUserId is optional at this point
  if (areAllDefined(databaseConnection, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Only family heads have their userId in the families table
  // A result from this indicates the userId and familyId combo reference a family head
  const [family] = await databaseQuery(
    databaseConnection,
    'SELECT 1 FROM families WHERE userId = ? AND familyId = ? LIMIT 1',
    [userId, familyId],
  );

  if (areAllDefined(family)) {
    await deleteFamily(databaseConnection, userId, familyId, familyActiveSubscription);
  }
  else {
    await leaveFamily(databaseConnection, userId, familyId);
  }

  // If user is family member, we can send a notification to remaining members that they left
  // If user is the family head, sendNotification will find no userNotificationTokens (as the family has been deleted),
  // ultimately send no APN.
  createFamilyMemberLeaveNotification(userId, familyId);
}

/**
 * Helper function for deleteFamilyLeaveFamilyForUserIdFamilyId
 * User is the head of their family. Therefore, they have an obligation to it.
 * They cannot leave, but they can delete their family (if there are no other family members and their subscription is non-renewing)
 */
async function deleteFamily(databaseConnection, familyId, familyActiveSubscription) {
  if (areAllDefined(databaseConnection, familyId, familyActiveSubscription) === false) {
    throw new ValidationError('databaseConnection, familyId, or familyActiveSubscription missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // find the amount of family members in the family
  const familyMembers = await databaseQuery(
    databaseConnection,
    'SELECT 1 FROM familyMembers WHERE familyId = ? LIMIT 18446744073709551615',
    [familyId],
  );

  if (familyMembers.length > 1) {
    // Cannot destroy family until other members are gone
    throw new ValidationError('Family still contains multiple members', global.CONSTANT.ERROR.FAMILY.LEAVE.STILL_FAMILY_MEMBERS);
  }

  /*
      If the active subscription's productId isn't DEFAULT_SUBSCRIPTION_PRODUCT_ID, that means the family has an active subscription
      If the active subscription is auto-renewal status is true or undefined, then we can't let the user delete their family.
      This is because the subscription could auto-renew after the user left their existing family.
      This would cause problems, as if they are in a new family as a non-family head or are in no family, as the subscription cannot attach anywhere.

      Only accept if there is no active subscription or the active subscription isn't auto-renewing
      */
  if (familyActiveSubscription.productId !== global.CONSTANT.SUBSCRIPTION.DEFAULT_SUBSCRIPTION_PRODUCT_ID
        && (areAllDefined(familyActiveSubscription.isAutoRenewing) === false || familyActiveSubscription.isAutoRenewing === true)) {
    throw new ValidationError('Family still has an auto-renewing, active subscription', global.CONSTANT.ERROR.FAMILY.LEAVE.SUBSCRIPTION_ACTIVE);
  }

  //  The user has no active subscription or manually stopped their subscription from renewing
  //  They will forfit the rest of their active subscription (if it exists) by deleting their family.
  //   However, they are safe from an accidential renewal

  // There is only one user left in the family, which is the API requester
  const [familyAccountCreationDate] = await databaseQuery(
    databaseConnection,
    'SELECT familyAccountCreationDate FROM families WHERE familyId = ? LIMIT 1',
    [familyId],
  );

  if (areAllDefined(familyAccountCreationDate) === false) {
    throw new ValidationError('familyAccountCreationDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // Destroy the family now that it is ok to do so
  const promises = [
    databaseQuery(
      databaseConnection,
      'DELETE FROM families WHERE familyId = ?',
      [familyId],
    ),
    // deletes all users from the family (should only be one)
    databaseQuery(
      databaseConnection,
      'DELETE FROM familyMembers WHERE familyId = ?',
      [familyId],
    ),
    // deletes records of user leaving
    databaseQuery(
      databaseConnection,
      'DELETE FROM previousFamilyMembers WHERE familyId = ?',
      [familyId],
    ),
    // delete all the corresponding dog, reminder, and log data
    databaseQuery(
      databaseConnection,
      'DELETE dogs, dogReminders, dogLogs FROM dogs LEFT JOIN dogLogs ON dogs.dogId = dogLogs.dogId LEFT JOIN dogReminders ON dogs.dogId = dogReminders.dogId WHERE dogs.familyId = ?',
      [familyId],
    ),
  ];
  await Promise.all(promises);
}

/**
 * Helper function for deleteFamilyLeaveFamilyForUserIdFamilyId
 * User is a member of a family. Therefore, they don't have an obligation to it and can leave.
 */
async function leaveFamily(databaseConnection, userId, familyId) {
  if (areAllDefined(databaseConnection, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  let promises = [
    getUserFirstNameLastNameForUserId(databaseConnection, userId),
    databaseQuery(
      databaseConnection,
      'SELECT familyMemberJoinDate FROM familyMembers WHERE userId = ? LIMIT 1',
      [userId],
    ),
  ];
  const [userFullName, [familyMemberJoinDate]] = await Promise.all(promises);

  if (areAllDefined(userFullName, familyMemberJoinDate) === false) {
    throw new ValidationError('userFullName or familyMemberJoinDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const { userFirstName, userLastName } = userFullName;

  promises = [
    // deletes user from family
    databaseQuery(
      databaseConnection,
      'DELETE FROM familyMembers WHERE userId = ?',
      [userId],
    ),
    // keep record of user leaving
    databaseQuery(
      databaseConnection,
      'INSERT INTO previousFamilyMembers(familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason) VALUES (?,?,?,?,?,?,?)',
      [familyId, userId, familyMemberJoinDate.familyMemberJoinDate, userFirstName, userLastName, new Date(), 'userLeft'],
    ),
  ];

  await Promise.all(promises);
}

/**
* Helper method for deleteFamilyLeaveFamilyKickFamilyMemberForUserIdFamilyId, goes through checks to attempt to kick a user from the family
*/
async function kickFamilyMemberForUserIdFamilyId(databaseConnection, userId, familyId, forKickUserId) {
  const familyKickUserId = formatSHA256Hash(forKickUserId);

  // have to specify who to kick from the family
  if (areAllDefined(databaseConnection, userId, familyId, familyKickUserId) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or familyKickUserId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // a user cannot kick themselves
  if (userId === familyKickUserId) {
    throw new ValidationError("You can't kick yourself from your own family", global.CONSTANT.ERROR.VALUE.INVALID);
  }
  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  // check to see if the user is the family head, as only the family head has permissions to kick
  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can kick family members', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  let promises = [
    getUserFirstNameLastNameForUserId(databaseConnection, familyKickUserId),
    databaseQuery(
      databaseConnection,
      'SELECT familyMemberJoinDate FROM familyMembers WHERE userId = ? LIMIT 1',
      [familyKickUserId],
    ),
  ];
  const [userFullName, [familyMemberJoinDate]] = await Promise.all(promises);

  if (areAllDefined(userFullName, familyMemberJoinDate) === false) {
    throw new ValidationError('userFullName or familyMemberJoinDate missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const { userFirstName, userLastName } = userFullName;

  promises = [
    // familyKickUserId is valid, familyKickUserId is different then the requester, requester is the family head so everything is valid
    // kick the user by deleting them from the family
    databaseQuery(
      databaseConnection,
      'DELETE FROM familyMembers WHERE userId = ?',
      [familyKickUserId],
    ),
    // keep a record of user kicked
    databaseQuery(
      databaseConnection,
      'INSERT INTO previousFamilyMembers(familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason) VALUES (?,?,?,?,?,?,?)',
      [familyId, familyKickUserId, familyMemberJoinDate.familyMemberJoinDate, userFirstName, userLastName, new Date(), 'userKicked'],
    ),
  ];

  await Promise.all(promises);

  // The alarm notifications retrieve the notification tokens of familyMembers right as they fire, so the user will not be included
  createFamilyMemberLeaveNotification(familyKickUserId, familyId);
  createUserKickedNotification(familyKickUserId);
}

module.exports = { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId };
