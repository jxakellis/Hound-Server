import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { createFamilyMemberJoinNotification, createFamilyLockedNotification } from '../../main/tools/notifications/alert/createFamilyNotification.js';
import { type FamiliesRow, familiesColumns } from '../../main/types/FamiliesRow.js';

import { getAllFamilyMembersForFamilyId, isUserIdInFamily } from '../getFor/getForFamily.js';
import { getActiveTransaction } from '../getFor/getForTransactions.js';

/**
* Helper method for createFamilyForUserId, goes through checks to attempt to add user to desired family
*/
async function addFamilyMember(databaseConnection: Queryable, userId: string, forFamilyCode: string): Promise<void> {
  const familyCode = forFamilyCode.toUpperCase();

  // retrieve information about the family linked to the familyCode
  const families = await databaseQuery<FamiliesRow[]>(
    databaseConnection,
    `SELECT ${familiesColumns}
    FROM families f
    WHERE familyCode = ?
    LIMIT 1`,
    [familyCode],
  );

  const family = families.safeIndex(0);

  // make sure the familyCode was valid by checking if it matched a family
  if (family === undefined) {
    // result length is zero so there are no families with that familyCode
    throw new HoundError('family missing; familyCode is not linked to any family', addFamilyMember, ERROR_CODES.FAMILY.JOIN.FAMILY_CODE_INVALID);
  }
  // familyCode exists and is linked to a family, now check if family is locked against new members
  if (family.familyIsLocked === 1) {
    throw new HoundError('Family is locked', addFamilyMember, ERROR_CODES.FAMILY.JOIN.FAMILY_LOCKED);
  }

  // the familyCode is valid and linked to an UNLOCKED family
  const isUserInFamily = await isUserIdInFamily(databaseConnection, userId);

  if (isUserInFamily === true) {
    throw new HoundError('You are already in a family', addFamilyMember, ERROR_CODES.FAMILY.JOIN.IN_FAMILY_ALREADY);
  }

  // Don't use .familyActiveSubscription property: the property wasn't assigned to the request due to the user not being in a family (only assigned with familyId is path param)
  const familyActiveSubscription = await getActiveTransaction(databaseConnection, userId);
  const familyMembers = await getAllFamilyMembersForFamilyId(databaseConnection, family.familyId);

  if (familyActiveSubscription === undefined) {
    throw new HoundError('familyActiveSubscription missing', addFamilyMember, ERROR_CODES.VALUE.MISSING);
  }

  // the family is either at the limit of family members is exceeds the limit, therefore no new users can join
  if (familyMembers.length >= familyActiveSubscription.numberOfFamilyMembers) {
    throw new HoundError(`Family member limit of ${familyActiveSubscription.numberOfFamilyMembers} exceeded`, addFamilyMember, ERROR_CODES.FAMILY.LIMIT.FAMILY_MEMBER_TOO_LOW);
  }

  // familyCode validated and user is not a family member in any family
  // insert the user into the family as a family member.
  await databaseQuery(
    databaseConnection,
    `INSERT INTO familyMembers
      (
        userId,
        familyId,
        familyMemberJoinDate
        )
        VALUES (
          ?,
          ?,
          CURRENT_TIMESTAMP()
          )`,
    [
      userId,
      family.familyId,
      // none, default value
    ],
  );

  const { offerIdentifier, transactionId } = familyActiveSubscription;

  if (offerIdentifier !== undefined) {
    // A new family member joined a family with a subscription that has an offer code, keep track that offer identifer was utilized
    await databaseQuery(
      databaseConnection,
      `UPDATE transactions
              SET didUtilizeOfferIdentifier = 1
              WHERE transactionId = ?`,
      [transactionId],
    );
  }

  createFamilyMemberJoinNotification(userId, family.familyId);
}

/**
          * Helper method for updateFamilyForFamilyId, switches the family familyIsLocked status
          */
async function updateIsLocked(databaseConnection: Queryable, userId: string, familyId: string, familyIsLocked: boolean): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE families
              SET familyIsLocked = ?
              WHERE familyId = ?`,
    [familyIsLocked, familyId],
  );

  createFamilyLockedNotification(userId, familyId, familyIsLocked);
}

// TODO FUTURE add logic for a family to allow it to switch family heads. this will mean checking the active subscription to make sure it is not renewing, similar to deleting a family.
// ^^ also check other logic, since in the past a family always had the same userId for its family head, but now that could switch, so verify that functions are compatible with that (e.g. retrieving transactions, reassigning transctions, transaction metrics)

/**
            *  Queries the database to update a family to add a new user. If the query is successful, then returns
            *  If a problem is encountered, creates and throws custom error
            */
async function updateFamilyForUserIdFamilyId(databaseConnection: Queryable, userId: string, familyId?: string, familyCode?: string, familyIsLocked?: boolean): Promise<void> {
  if (familyId === undefined) {
    if (familyCode !== undefined) {
      await addFamilyMember(databaseConnection, userId, familyCode);
      return;
    }
  }
  else if (familyId !== undefined) {
    if (familyIsLocked !== undefined) {
      await updateIsLocked(databaseConnection, userId, familyId, familyIsLocked);
      return;
    }
  }

  throw new HoundError('No matching values provided', updateFamilyForUserIdFamilyId, ERROR_CODES.VALUE.MISSING);
}

export { updateFamilyForUserIdFamilyId };
