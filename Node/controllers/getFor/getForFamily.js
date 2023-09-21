const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

/**
 *  If the query is successful, returns the userId, familyCode, familyIsLocked, familyMembers, previousFamilyMembers, and familyActiveSubscription for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllFamilyInformationForFamilyId(databaseConnection, familyId, familyActiveSubscription) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }
  // family id is validated, therefore we know familyMembers is >= 1 for familyId
  // find which family member is the head
  const promises = [
    databaseQuery(
      databaseConnection,
      `SELECT userId, familyCode, familyIsLocked
      FROM families f
      WHERE familyId = ?
      LIMIT 1`,
      [familyId],
    ),
    // get family members
    getAllFamilyMembersForFamilyId(databaseConnection, familyId),
    getAllPreviousFamilyMembersForFamilyId(databaseConnection, familyId),
  ];

  const [[family], familyMembers, previousFamilyMembers] = await Promise.all(promises);

  const result = {
    ...family,
    familyMembers,
    previousFamilyMembers,
    familyActiveSubscription,
  };

  return result;
}

async function getAllFamilyMembersForFamilyId(databaseConnection, familyId) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // get family members
  const result = await databaseQuery(
    databaseConnection,
    `SELECT u.userId, u.userFirstName, u.userLastName
    FROM familyMembers fm
    LEFT JOIN users u ON fm.userId = u.userId
    WHERE fm.familyId = ?
    LIMIT 18446744073709551615`,
    [familyId],
  );

  return result;
}

async function getAllPreviousFamilyMembersForFamilyId(databaseConnection, familyId) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // get family members
  const result = await databaseQuery(
    databaseConnection,
    `SELECT userId, userFirstName, userLastName
    FROM previousFamilyMembers pfm
    WHERE familyId = ?
    ORDER BY familyMemberLeaveDate DESC
    LIMIT 18446744073709551615`,
    [familyId],
  );

  const userIds = [];
  // Only return one instance for each userId. I.e. if a user left a family multiple times, return the previousFamilyMember object for the most recent leave
  for (let i = 0; i < result.length; i += 1) {
    if (userIds.includes(result[i].userId)) {
      // We have a more recent family leave recorded for this userId, therefore remove the entry
      result.splice(i, 1);
      // de-iterate i so we don't skip an item
      i -= 1;
    }
    else {
      // Don't have userId recorded
      userIds.push(result[i].userId);
    }
  }

  return result;
}

/**
 *  If the query is successful, returns the family member for the userId. This function is used to determine if a user is in a family
 *  If a problem is encountered, creates and throws custom error
 */
async function getFamilyMemberUserIdForUserId(databaseConnection, userId) {
  // validate that a userId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const result = await databaseQuery(
    databaseConnection,
    `SELECT userId
    FROM familyMembers fm
    WHERE userId = ?
    LIMIT 1`,
    [userId],
  );

  return result;
}

/**
 *  If the query is successful, returns the userId of the family head
 *  If a problem is encountered, creates and throws custom error
 */
async function getFamilyHeadUserIdForFamilyId(databaseConnection, familyId) {
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const [result] = await databaseQuery(
    databaseConnection,
    `SELECT userId
    FROM families f
    WHERE familyId = ?
    LIMIT 1`,
    [familyId],
  );

  if (areAllDefined(result) === false) {
    return null;
  }

  return result.userId;
}

/**
 * If the query is successful, returns the familyId for the userId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getFamilyIdForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // have to specifically reference the columns, otherwise fm.userId will override u.userId.
  // Therefore setting userId to null (if there is no family member) even though the userId isn't null.
  const [result] = await databaseQuery(
    databaseConnection,
    `SELECT fm.familyId
    FROM users u
    LEFT JOIN familyMembers fm ON u.userId = fm.userId
    WHERE u.userId = ?
    LIMIT 1`,
    [userId],
  );

  if (areAllDefined(result) === false) {
    return null;
  }

  return result.familyId;
}

module.exports = {
  getAllFamilyInformationForFamilyId, getAllFamilyMembersForFamilyId, getFamilyMemberUserIdForUserId, getFamilyHeadUserIdForFamilyId, getFamilyIdForUserId,
};
