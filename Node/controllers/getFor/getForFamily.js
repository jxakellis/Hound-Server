const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { formatSHA256Hash } = require('../../main/tools/format/formatObject');

const usersColumns = 'users.userId, users.userFirstName, users.userLastName';
const previousFamilyMembersColumns = 'previousFamilyMembers.userId, previousFamilyMembers.userFirstName, previousFamilyMembers.userLastName';
const familiesColumns = 'userId, familyCode, familyIsLocked';

/**
 *  If the query is successful, returns the userId, familyCode, familyIsLocked, and familyMembers for the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getAllFamilyInformationForFamilyId(databaseConnection, familyId, familyActiveSubscription) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.constant.error.value.MISSING);
  }
  // family id is validated, therefore we know familyMembers is >= 1 for familyId
  // find which family member is the head
  const promises = [
    databaseQuery(
      databaseConnection,
      `SELECT ${familiesColumns} FROM families WHERE familyId = ? LIMIT 1`,
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
    throw new ValidationError('databaseConnection or familyId missing', global.constant.error.value.MISSING);
  }

  // get family members
  const result = await databaseQuery(
    databaseConnection,
    `SELECT ${usersColumns} FROM familyMembers LEFT JOIN users ON familyMembers.userId = users.userId WHERE familyMembers.familyId = ? LIMIT 18446744073709551615`,
    [familyId],
  );

  return result;
}

async function getAllPreviousFamilyMembersForFamilyId(databaseConnection, familyId) {
  // validate that a familyId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, familyId) === false) {
    throw new ValidationError('databaseConnection or familyId missing', global.constant.error.value.MISSING);
  }

  // get family members
  const result = await databaseQuery(
    databaseConnection,
    `SELECT ${previousFamilyMembersColumns} FROM previousFamilyMembers WHERE familyId = ? ORDER BY familyMemberLeaveDate DESC LIMIT 18446744073709551615`,
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
 *  If the query is successful, returns the family member for the userId.
 *  If a problem is encountered, creates and throws custom error
 */
async function getFamilyMemberUserIdForUserId(databaseConnection, userId) {
  // validate that a userId was passed, assume that its in the correct format
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.constant.error.value.MISSING);
  }

  const result = await databaseQuery(
    databaseConnection,
    'SELECT userId FROM familyMembers WHERE userId = ? LIMIT 1',
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
    throw new ValidationError('databaseConnection or familyId missing', global.constant.error.value.MISSING);
  }

  let result = await databaseQuery(
    databaseConnection,
    'SELECT userId FROM families WHERE familyId = ? LIMIT 1',
    [familyId],
  );

  [result] = result;
  if (areAllDefined(result) === false) {
    return undefined;
  }

  return formatSHA256Hash(result.userId);
}

module.exports = {
  getAllFamilyInformationForFamilyId, getAllFamilyMembersForFamilyId, getFamilyMemberUserIdForUserId, getFamilyHeadUserIdForFamilyId,
};
