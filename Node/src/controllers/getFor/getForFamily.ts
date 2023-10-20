import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type FamilyInformation } from '../../main/types/CompositeRow.js';
import { type FamiliesRow, familiesColumns } from '../../main/types/FamiliesRow.js';
import { type FamilyMembersRow, familyMembersColumns } from '../../main/types/FamilyMembersRow.js';
import { type PreviousFamilyMembersRow, previousFamilyMembersColumns } from '../../main/types/PreviousFamilyMembersRow.js';
import { type TransactionsRow } from '../../main/types/TransactionsRow.js';
import { type PublicUsersRow, publicUsersColumns } from '../../main/types/UsersRow.js';

/**
 * @param {*} databaseConnection
 * @param {*} familyId
 * @returns An array of familyMembers (userId, userFirstName, userLastName), representing each user currently in the family
 * @throws If an error is encountered
 */
async function getAllFamilyMembersForFamilyId(databaseConnection: Queryable, familyId: string): Promise<PublicUsersRow[]> {
  const result = await databaseQuery<PublicUsersRow[]>(
    databaseConnection,
    `SELECT ${publicUsersColumns}
    FROM familyMembers fm
    JOIN users u ON fm.userId = u.userId
    WHERE fm.familyId = ?
    LIMIT 18446744073709551615`,
    [familyId],
  );

  return result;
}

/**
 * @param {*} databaseConnection
 * @param {*} familyId
 * @returns An array of previousFamilyMembers (userId, userFirstName, userLastName), representing the most recent record of each user that has left the family
 * @throws If an error is encountered
 */
async function getAllPreviousFamilyMembersForFamilyId(databaseConnection: Queryable, familyId: string): Promise<PreviousFamilyMembersRow[]> {
  const result = await databaseQuery<PreviousFamilyMembersRow[]>(
    databaseConnection,
    `SELECT ${previousFamilyMembersColumns}
    FROM previousFamilyMembers pfm
    WHERE familyId = ?
    ORDER BY familyMemberLeaveDate DESC
    LIMIT 18446744073709551615`,
    [familyId],
  );

  // Only return one instance for each userId. I.e. if a user left a family multiple times, return the previousFamilyMember object for the most recent leave
  const uniquePreviousFamilyMembers = result.filter((previousFamilyMember, index) => index === result.findIndex((iter) => iter.userId === previousFamilyMember.userId));
  // TODO NOW make sure this works
  console.log(result);
  console.log(uniquePreviousFamilyMembers);

  return uniquePreviousFamilyMembers;
}

/**
 * @param {*} databaseConnection
 * @param {*} userId
 * @returns true if the userId is in any family, false if not
 * @throws If an error is encountered
 */
async function isUserIdInFamily(databaseConnection: Queryable, userId: string): Promise<boolean> {
  const result = await databaseQuery<FamilyMembersRow[]>(
    databaseConnection,
    `SELECT ${familyMembersColumns}
    FROM familyMembers fm
    WHERE userId = ?
    LIMIT 1`,
    [userId],
  );

  return result.length > 0;
}

/**
 * @param {*} databaseConnection
 * @param {*} familyId
 * @returns userId of family's head or undefined
 * @throws If an error is encountered
 */
async function getFamilyHeadUserId(databaseConnection: Queryable, userId: string): Promise<string | undefined> {
  const result = await databaseQuery<FamiliesRow[]>(
    databaseConnection,
    `WITH targetFamilyMember AS (
      SELECT familyId
      FROM familyMembers
      WHERE userId = ?
    )
    SELECT ${familiesColumns}
    FROM targetFamilyMember tfm 
    JOIN families f ON tfm.familyId = f.familyId
    LIMIT 1`,
    [userId],
  );

  return result.safeIndex(0)?.userId;
}

/**
 * @param {*} databaseConnection
 * @param {*} userId the userId of a family member of some family
 * @returns familyId of the user's family or undefined
 * @throws If an error is encountered
 */
async function getFamilyId(databaseConnection: Queryable, userId: string): Promise<string | undefined> {
  const result = await databaseQuery<FamilyMembersRow[]>(
    databaseConnection,
    `SELECT ${familyMembersColumns}
    FROM users u
    JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userId = ?
    LIMIT 1`,
    [userId],
  );

  return result.safeIndex(0)?.familyId;
}

/**
 *  If the query is successful, returns the userId, familyCode, familyIsLocked, familyMembers, previousFamilyMembers, and familyActiveSubscription for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
/**
 * @param {*} databaseConnection
 * @param {*} familyId
 * @param {*} familyActiveSubscription
 * @returns A key-value pairing of {userId (of familyHead), familyCode, familyIsLocked, familyMembers (array), previousFamilyMembers (array), familyActiveSubscription (object)}
 * @throws If an error is encountered
 */
async function getAllFamilyInformationForFamilyId(databaseConnection: Queryable, familyId: string, familyActiveSubscription: TransactionsRow): Promise<FamilyInformation | undefined> {
  // family id is validated, therefore we know familyMembers is >= 1 for familyId
  // find which family member is the head
  const familiesResult = await databaseQuery<FamiliesRow[]>(
    databaseConnection,
    `SELECT ${familiesColumns}
    FROM families f
    WHERE familyId = ?
    LIMIT 1`,
    [familyId],
  );
  const family = familiesResult.safeIndex(0);

  if (family === undefined) {
    return undefined;
  }

  const familyMembers = await getAllFamilyMembersForFamilyId(databaseConnection, familyId);
  const previousFamilyMembers = await getAllPreviousFamilyMembersForFamilyId(databaseConnection, familyId);

  const result: FamilyInformation = {
    ...family,
    familyMembers,
    previousFamilyMembers,
    familyActiveSubscription,
  };

  return result;
}

export {
  getAllFamilyInformationForFamilyId, getAllFamilyMembersForFamilyId, isUserIdInFamily, getFamilyHeadUserId, getFamilyId,
};
