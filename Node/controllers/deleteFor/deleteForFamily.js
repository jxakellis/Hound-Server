const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatSHA256Hash } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

const { createFamilyMemberLeaveNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');
const { createUserKickedNotification } = require('../../main/tools/notifications/alert/createUserKickedNotification');

/**
*  Depending on whether the user is a family member or a family head,
*  queries the database to remove the user from their current family or delete the family.
*/
async function deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection, userId, familyId, familyActiveSubscription) {
  // familyKickUserId is optional at this point
  if (areAllDefined(databaseConnection, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, userId, or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  if (familyHeadUserId === userId) {
    await deleteFamily(databaseConnection, familyId, familyActiveSubscription);
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
    `SELECT 1
    FROM familyMembers fm
    WHERE familyId = ?
    LIMIT 18446744073709551615`,
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
        && familyActiveSubscription.isAutoRenewing !== false) {
    throw new ValidationError('Family still has an auto-renewing, active subscription', global.CONSTANT.ERROR.FAMILY.LEAVE.SUBSCRIPTION_ACTIVE);
  }

  //  The user has no active subscription or manually stopped their subscription from renewing
  //  They will forfit the rest of their active subscription (if it exists) by deleting their family.
  //  However, they are safe from an accidential renewal

  // TO DO NOW TEST that these records save all the families and family members correctly
  // Copy the current, up-to-date records into the "previous" tables. This keeps a record in case we need to reference it later, but in a table that isn't used much
  let promises = [
    databaseQuery(
      databaseConnection,
      `INSERT INTO previousFamilies
      (familyId, userId, familyCode, familyIsLocked, familyAccountCreationDate, familyAccountDeletionDate)
      SELECT familyId, userId, familyCode, familyIsLocked, familyAccountCreationDate, ?
      FROM families f
      WHERE familyId = ?`,
      [new Date(), familyId],
    ),
    databaseQuery(
      databaseConnection,
      `INSERT INTO previousFamilyMembers
      (familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason) 
      SELECT fm.familyId, fm.userId, fm.familyMemberJoinDate, u.userFirstName, u.userLastName, ?, 'familyDeleted' 
      FROM familyMembers fm
      JOIN users u ON fm.userId = u.userId
      WHERE fm.familyId = ?`,
      [new Date(), familyId],
    ),
  ];
  await Promise.all(promises);

  // Family copied into "previous" tables, delete the actual family now
  promises = [
    databaseQuery(
      databaseConnection,
      `DELETE FROM families
      WHERE familyId = ?`,
      [familyId],
    ),
    // deletes all users from the family (should only be one)
    databaseQuery(
      databaseConnection,
      `DELETE FROM familyMembers
      WHERE familyId = ?`,
      [familyId],
    ),
    // delete all the corresponding dog, reminder, and log data
    databaseQuery(
      databaseConnection,
      `DELETE d, dr, dl
      FROM dogs d
      LEFT JOIN dogLogs dl ON d.dogId = dl.dogId
      LEFT JOIN dogReminders dr ON d.dogId = dr.dogId
      WHERE d.familyId = ?`,
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

  // keep record of user leaving, do this first so the delete statement doesn't mess with this query
  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousFamilyMembers
    (familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason) 
    SELECT fm.familyId, fm.userId, fm.familyMemberJoinDate, u.userFirstName, u.userLastName, ?, 'userLeft' 
    FROM familyMembers fm
    JOIN users u ON fm.userId = u.userId
    WHERE fm.userId = ?`,
    [new Date(), userId],
  );

  // deletes user from family
  await databaseQuery(
    databaseConnection,
    `DELETE FROM familyMembers
    WHERE userId = ?`,
    [userId],
  );
}

/**
* Helper method for deleteFamilyLeaveFamilyKickFamilyMemberForUserIdFamilyId, goes through checks to attempt to kick a user from the family
*/
async function kickFamilyMemberForUserIdFamilyId(databaseConnection, userId, familyId, forKickedUserId) {
  const kickedUserId = formatSHA256Hash(forKickedUserId);

  // have to specify who to kick from the family
  if (areAllDefined(databaseConnection, userId, familyId, kickedUserId) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or kickedUserId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // a user cannot kick themselves
  if (userId === kickedUserId) {
    throw new ValidationError("You can't kick yourself from your own family", global.CONSTANT.ERROR.VALUE.INVALID);
  }
  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  // check to see if the user is the family head, as only the family head has permissions to kick
  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can kick family members', global.CONSTANT.ERROR.PERMISSION.INVALID.FAMILY);
  }

  // kick the user by deleting them from the family, do this first so the delete statement doesn't mess with this query
  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousFamilyMembers
    (familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason) 
    SELECT fm.familyId, fm.userId, fm.familyMemberJoinDate, u.userFirstName, u.userLastName, ?, 'userKicked' 
    FROM familyMembers fm
    JOIN users u ON fm.userId = u.userId
    WHERE fm.userId = ?`,
    [new Date(), kickedUserId],
  );

  // deletes user from family
  await databaseQuery(
    databaseConnection,
    `DELETE FROM familyMembers
    WHERE userId = ?`,
    [kickedUserId],
  );

  // The alarm notifications retrieve the notification tokens of familyMembers right as they fire, so the user will not be included
  createFamilyMemberLeaveNotification(kickedUserId, familyId);
  createUserKickedNotification(kickedUserId);
}

module.exports = { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId };
