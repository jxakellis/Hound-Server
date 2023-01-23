const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { generateVerifiedFamilyCode } = require('../../main/tools/general/generateVerifiedFamilyCode');
const { ValidationError } = require('../../main/tools/general/errors');
const { hash } = require('../../main/tools/format/hash');
const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { getFamilyMemberUserIdForUserId } = require('../getFor/getForFamily');

const { reassignActiveInAppSubscriptionForUserIdFamilyId } = require('../updateFor/updateForInAppSubscriptions');

/**
 *  Queries the database to create a family. If the query is successful, then returns the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createFamilyForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyAccountCreationDate = new Date();
  const familyId = hash(userId, familyAccountCreationDate.toISOString());

  if (areAllDefined(familyAccountCreationDate, familyId) === false) {
    throw new ValidationError('familyAccountCreationDate or familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // check if the user is already in a family
  const existingFamilyResult = await getFamilyMemberUserIdForUserId(databaseConnection, userId);

  // validate that the user is not in a family
  if (existingFamilyResult.length !== 0) {
    throw new ValidationError('User is already in a family', global.CONSTANT.ERROR.FAMILY.JOIN.IN_FAMILY_ALREADY);
  }

  // create a family code for the new family
  const familyCode = await generateVerifiedFamilyCode(databaseConnection);

  const promises = [
    databaseQuery(
      databaseConnection,
      'INSERT INTO families(userId, familyId, familyCode, familyIsLocked, familyAccountCreationDate) VALUES (?, ?, ?, ?, ?)',
      [userId, familyId, familyCode, false, familyAccountCreationDate],
    ),
    databaseQuery(
      databaseConnection,
      'INSERT INTO familyMembers(userId, familyId, familyMemberJoinDate) VALUES (?, ?, ?)',
      [userId, familyId, new Date()],
    ),
  ];

  await Promise.all(promises);

  await reassignActiveInAppSubscriptionForUserIdFamilyId(databaseConnection, userId, familyId);

  return familyId;
}

module.exports = { createFamilyForUserId };
