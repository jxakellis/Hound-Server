import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

import { getFamilyMembersForFamilyId, getFamilyForUserId } from '../get/getFamily.js';

import { createFamilyMemberLeaveNotification } from '../../main/tools/notifications/alert/createFamilyNotification.js';
import { createUserKickedNotification } from '../../main/tools/notifications/alert/createUserKickedNotification.js';
import { type TransactionsRow } from '../../main/types/rows/TransactionsRow.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { SUBSCRIPTION } from '../../main/server/globalConstants.js';

/**
* Helper function for deleteFamilyLeaveFamilyForUserIdFamilyId
* User is the head of their family. Therefore, they have an obligation to it.
* They cannot leave, but they can delete their family (if there are no other family members and their subscription is non-renewing)
*/
async function deleteFamily(databaseConnection: Queryable, familyId: string, familyActiveSubscription: TransactionsRow): Promise<void> {
  const familyMembers = await getFamilyMembersForFamilyId(databaseConnection, familyId);

  if (familyMembers.length > 1) {
    // Cannot delete family until other members are gone
    throw new HoundError('Family still contains multiple members', deleteFamily, ERROR_CODES.FAMILY.LEAVE.STILL_FAMILY_MEMBERS);
  }

  /*
    If the active subscription's productId isn't DEFAULT_SUBSCRIPTION_PRODUCT_ID, that means the family has an active subscription
    If the active subscription is auto-renewal status is true or undefined, then we can't let the user delete their family.
    This is because the subscription could auto-renew after the user left their existing family.
    This would cause problems, as if they are in a new family as a non-family head or are in no family, as the subscription cannot attach anywhere.

    Only accept if there is no active subscription or the active subscription isn't auto-renewing
    */

  if (familyActiveSubscription.productId !== SUBSCRIPTION.DEFAULT_SUBSCRIPTION_PRODUCT_ID
      && familyActiveSubscription.autoRenewStatus === 1) {
    throw new HoundError('Family still has an auto-renewing, active subscription', deleteFamily, ERROR_CODES.FAMILY.LEAVE.SUBSCRIPTION_ACTIVE);
  }

  //  The user has no active subscription or manually stopped their subscription from renewing
  //  They will forfeit the rest of their active subscription (if it exists) by deleting their family.
  //  However, they are safe from an accidental renewal

  // Copy the current, up-to-date records into the "previous" tables. This keeps a record in case we need to reference it later, but in a table that isn't used much
  let promises = [
    databaseQuery(
      databaseConnection,
      `INSERT INTO previousFamilies
          (
            familyId, familyHeadUserId, familyCode, familyIsLocked, familyAccountCreationDate, familyAccountDeletionDate
            )
            SELECT familyId, familyHeadUserId, familyCode, familyIsLocked, familyAccountCreationDate, CURRENT_TIMESTAMP()
            FROM families f
            WHERE familyId = ?`,
      [familyId],
    ),
    databaseQuery(
      databaseConnection,
      `INSERT INTO previousFamilyMembers
              (
                familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason
                ) 
                SELECT fm.familyId, fm.userId, fm.familyMemberJoinDate, u.userFirstName, u.userLastName, CURRENT_TIMESTAMP(), 'familyDeleted' 
                FROM familyMembers fm
                JOIN users u ON fm.userId = u.userId
                WHERE fm.familyId = ?`,
      [familyId],
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
                      LEFT JOIN dogLogs dl ON d.dogUUID = dl.dogUUID
                      LEFT JOIN dogReminders dr ON d.dogUUID = dr.dogUUID
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
async function leaveFamily(databaseConnection: Queryable, userId: string): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousFamilyMembers
                      (
                        familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason
                        ) 
                        SELECT fm.familyId, fm.userId, fm.familyMemberJoinDate, u.userFirstName, u.userLastName, CURRENT_TIMESTAMP(), 'userLeft' 
                        FROM familyMembers fm
                        JOIN users u ON fm.userId = u.userId
                        WHERE fm.userId = ?`,
    [userId],
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
async function kickFamilyMemberForUserIdFamilyId(databaseConnection: Queryable, userId: string, familyId: string, kickedUserId: string): Promise<void> {
  // a user cannot kick themselves
  if (userId === kickedUserId) {
    throw new HoundError("You can't kick yourself from your own family", kickFamilyMemberForUserIdFamilyId, ERROR_CODES.VALUE.INVALID);
  }

  const family = await getFamilyForUserId(databaseConnection, userId);

  if (family === undefined || family === null) {
    throw new HoundError('family missing', kickFamilyMemberForUserIdFamilyId, ERROR_CODES.VALUE.MISSING);
  }

  if (family.familyHeadUserId !== userId) {
    throw new HoundError('You are not the family head. Only the family head can kick family members', kickFamilyMemberForUserIdFamilyId, ERROR_CODES.PERMISSION.INVALID.FAMILY);
  }

  // kick the user by deleting them from the family, do this first so the delete statement doesn't mess with this query
  await databaseQuery(
    databaseConnection,
    `INSERT INTO previousFamilyMembers
                            (
                              familyId, userId, familyMemberJoinDate, userFirstName, userLastName, familyMemberLeaveDate, familyMemberLeaveReason
                              ) 
                              SELECT fm.familyId, fm.userId, fm.familyMemberJoinDate, u.userFirstName, u.userLastName, CURRENT_TIMESTAMP(), 'userKicked' 
                              FROM familyMembers fm
                              JOIN users u ON fm.userId = u.userId
                              WHERE fm.userId = ?`,
    [kickedUserId],
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

/**
                              *  Depending on whether the user is a family member or a family head,
                              *  queries the database to remove the user from their current family or delete the family.
                              */
async function deleteFamilyLeaveFamilyForUserIdFamilyId(databaseConnection: Queryable, userId: string, familyId: string, familyActiveSubscription: TransactionsRow): Promise<void> {
  const family = await getFamilyForUserId(databaseConnection, userId);

  if (family === undefined || family === null) {
    throw new HoundError('family missing', deleteFamilyLeaveFamilyForUserIdFamilyId, ERROR_CODES.VALUE.MISSING);
  }

  if (family.familyHeadUserId === userId) {
    await deleteFamily(databaseConnection, familyId, familyActiveSubscription);
  }
  else {
    await leaveFamily(databaseConnection, userId);
  }

  // If user is family member, we can send a notification to remaining members that they left
  // If user is the family head, sendNotification will find no userNotificationTokens (as the family has been deleted),
  // ultimately send no APN.
  createFamilyMemberLeaveNotification(userId, familyId);
}

export { deleteFamilyLeaveFamilyForUserIdFamilyId, kickFamilyMemberForUserIdFamilyId };
