import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { type FamilyInformation } from '../../main/types/rows/CompositeRow.js';
import { type FamiliesRow, familiesColumns } from '../../main/types/rows/FamiliesRow.js';
import { type PreviousFamilyMembersRow, previousFamilyMembersColumns } from '../../main/types/rows/PreviousFamilyMembersRow.js';
import { type TransactionsRow } from '../../main/types/rows/TransactionsRow.js';
import { type PublicUsersRow, publicUsersColumns } from '../../main/types/rows/UsersRow.js';

async function getFamilyForFamilyId(databaseConnection: Queryable, familyId: string): Promise<FamiliesRow | undefined> {
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

  return familiesResult.safeIndex(0);
}

/**
 * @param {*} databaseConnection
 * @param {*} userId the userId of a family member of some family
 * @returns familyId of the user's family or undefined
 * @throws If an error is encountered
 */
async function getFamilyForUserId(databaseConnection: Queryable, userId: string): Promise<FamiliesRow | undefined> {
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

  return result.safeIndex(0);
}

/**
 * @param {*} databaseConnection
 * @param {*} familyId
 * @returns An array of familyMembers (userId, userFirstName, userLastName), representing each user currently in the family
 * @throws If an error is encountered
 */
async function getFamilyMembersForFamilyId(databaseConnection: Queryable, familyId: string): Promise<PublicUsersRow[]> {
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
async function getPreviousFamilyMembersForFamilyId(databaseConnection: Queryable, familyId: string): Promise<PreviousFamilyMembersRow[]> {
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

  return uniquePreviousFamilyMembers;
}

/**
 * @param {*} databaseConnection
 * @param {*} familyId
 * @param {*} familyActiveSubscription
 * @returns A key-value pairing of {userId (of familyHead), familyCode, familyIsLocked, familyMembers (array), previousFamilyMembers (array), familyActiveSubscription (object)}
 * @throws If an error is encountered
 */
async function getAllFamilyInformationForFamilyId(databaseConnection: Queryable, familyId: string, familyActiveSubscription: TransactionsRow): Promise<FamilyInformation | undefined> {
  const family = await getFamilyForFamilyId(databaseConnection, familyId);

  if (family === undefined || family === null) {
    return undefined;
  }

  const familyMembers = await getFamilyMembersForFamilyId(databaseConnection, familyId);
  const previousFamilyMembers = await getPreviousFamilyMembersForFamilyId(databaseConnection, familyId);

  const result: FamilyInformation = {
    ...family,
    familyMembers,
    previousFamilyMembers,
    familyActiveSubscription,
  };

  return result;
}

export {
  getFamilyForFamilyId, getFamilyForUserId, getFamilyMembersForFamilyId, getAllFamilyInformationForFamilyId,
};
