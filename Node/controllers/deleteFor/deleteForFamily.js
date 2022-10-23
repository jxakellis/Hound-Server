const { ValidationError } = require('../../main/tools/general/errors');

const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { formatSHA256Hash } = require('../../main/tools/format/formatObject');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { getUserFirstNameLastNameForUserId } = require('../getFor/getForUser');
const { getFamilyHeadUserIdForFamilyId } = require('../getFor/getForFamily');

const { createUserKickedNotification } = require('../../main/tools/notifications/alert/createUserKickedNotification');
const { createFamilyMemberLeaveNotification } = require('../../main/tools/notifications/alert/createFamilyNotification');

/**
 *  Queries the database to either remove the user from their current family (familyMember) or delete the family and everything nested under it (families).
 *  If the query is successful, then returns
 *  If an error is encountered, creates and throws custom error
 */
async function deleteFamilyForUserIdFamilyId(databaseConnection, userId, familyId, forKickUserId, familyActiveSubscription) {
  const familyKickUserId = formatSHA256Hash(forKickUserId);

  // familyKickUserId is optional
  if (areAllDefined(databaseConnection, userId, familyId) === false) {
    throw new ValidationError('databaseConnection, userId, or familyId missing', global.constant.error.value.MISSING);
  }

  // This will only store the userId, familyId, userFirstName, and userLastName of any one in the family that has left / been kicked
  // Therefore, when trying to see who created a log (even if they have left the family), you can still see a corresponding name.
  if (areAllDefined(familyKickUserId)) {
    await kickFamilyMember(databaseConnection, userId, familyId, familyKickUserId);
  }
  else {
    await deleteFamily(databaseConnection, userId, familyId, familyActiveSubscription);
  }
}

/**
 * Helper method for deleteFamilyForUserIdFamilyId, goes through checks to remove a user from their family
 * If the user is the head of the family (and there are no other family members), we delete the family
 */
async function deleteFamily(databaseConnection, userId, familyId, familyActiveSubscription) {
  if (areAllDefined(databaseConnection, userId, familyId, familyActiveSubscription) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or familyActiveSubscription missing', global.constant.error.value.MISSING);
  }

  let promises = [
    // find out if the user is the family head
    databaseQuery(
      databaseConnection,
      'SELECT 1 FROM families WHERE userId = ? AND familyId = ? LIMIT 18446744073709551615',
      [userId, familyId],
    ),
    // find the amount of family members in the family
    databaseQuery(
      databaseConnection,
      'SELECT 1 FROM familyMembers WHERE familyId = ? LIMIT 18446744073709551615',
      [familyId],
    ),
  ];

  const [family, familyMembers] = await Promise.all(promises);

  // User is the head of the family, so has obligation to it.
  if (family.length === 1) {
    if (familyMembers.length !== 1) {
      // Cannot destroy family until other members are gone
      throw new ValidationError('Family still contains multiple members', global.constant.error.family.leave.INVALID);
    }

    /*
      If the active subscription's productId isn't DEFAULT_SUBSCRIPTION_PRODUCT_ID, that means the family has an active subscription
      If the active subscription is auto-renewal status is true or undefined, then we can't let the user delete their family.
      This is because the subscription could auto-renew after the user left their existing family.
      This would cause problems, as if they are in a new family as a non-family head or are in no family, as the subscription cannot attach anywhere.

      Only accept if there is no active subscription or the active subscription isn't auto-renewing
    */
    if (familyActiveSubscription.productId !== global.constant.subscription.DEFAULT_SUBSCRIPTION_PRODUCT_ID
      && (areAllDefined(familyActiveSubscription.isAutoRenewing) === false || familyActiveSubscription.isAutoRenewing === true)) {
      throw new ValidationError('Family still has an auto-renewing, active subscription', global.constant.error.family.leave.SUBSCRIPTION_ACTIVE);
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
      throw new ValidationError('familyAccountCreationDate missing', global.constant.error.value.MISSING);
    }

    // Destroy the family now that it is ok to do so
    promises = [
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
      // keep record of user leaving
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
  // User is not the head of the family, so no obligation
  else {
    promises = [
      getUserFirstNameLastNameForUserId(databaseConnection, userId),
      databaseQuery(
        databaseConnection,
        'SELECT familyMemberJoinDate FROM familyMembers WHERE userId = ? LIMIT 1',
        [userId],
      ),
    ];
    const [userFullName, [familyMemberJoinDate]] = await Promise.all(promises);
    const { userFirstName, userLastName } = userFullName;

    promises = [
      // can leave the family
      // deletes user from family
      databaseQuery(
        databaseConnection,
        'DELETE FROM familyMembers WHERE userId = ?',
        [userId],
      ),
      // keep record of user leaving
      databaseQuery(
        databaseConnection,
        'INSERT INTO previousFamilyMembers(familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReasonn) VALUES (?,?,?,?,?,?,?)',
        [familyId, userId, familyMemberJoinDate.familyMemberJoinDate, userFirstName, userLastName, new Date(), 'userLeft'],
      ),
    ];

    await Promise.all(promises);
  }

  // now that the user has successfully left their family (or destroyed it), we can send a notification to remaining members
  // NOTE: in the case of the user being the family head (aka the only family members if we reached this point),
  // this will ultimately find no userNotificationTokens for the other family members and send no APN
  createFamilyMemberLeaveNotification(userId, familyId);
}

/**
 * Helper method for deleteFamilyForUserIdFamilyId, goes through checks to attempt to kick a user from the family
 */
async function kickFamilyMember(databaseConnection, userId, familyId, forKickUserId) {
  const familyKickUserId = formatSHA256Hash(forKickUserId);

  // have to specify who to kick from the family
  if (areAllDefined(databaseConnection, userId, familyId, familyKickUserId) === false) {
    throw new ValidationError('databaseConnection, userId, familyId, or familyKickUserId missing', global.constant.error.value.MISSING);
  }
  // a user cannot kick themselves
  if (userId === familyKickUserId) {
    throw new ValidationError("You can't kick yourself from your family", global.constant.error.value.INVALID);
  }
  const familyHeadUserId = await getFamilyHeadUserIdForFamilyId(databaseConnection, familyId);

  // check to see if the user is the family head, as only the family head has permissions to kick
  if (familyHeadUserId !== userId) {
    throw new ValidationError('You are not the family head. Only the family head can kick family members', global.constant.error.family.permission.INVALID);
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
      'INSERT INTO previousFamilyMembers(familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReasonn) VALUES (?,?,?,?,?,?,?)',
      [familyId, userId, familyMemberJoinDate.familyMemberJoinDate, userFirstName, userLastName, new Date(), 'userKicked'],
    ),
  ];

  await Promise.all(promises);

  // The alarm notifications retrieve the notification tokens of familyMembers right as they fire, so the user will not be included
  createFamilyMemberLeaveNotification(familyKickUserId, familyId);
  createUserKickedNotification(familyKickUserId);
}

module.exports = { deleteFamilyForUserIdFamilyId };
