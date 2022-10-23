const { ValidationError } = require('../../main/tools/general/errors');
const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { hash } = require('../../main/tools/format/hash');

const { generateVerifiedFamilyCode } = require('../../main/tools/general/generateVerifiedFamilyCode');
const { getFamilyMemberUserIdForUserId } = require('../getFor/getForFamily');

/**
 *  Queries the database to create a family. If the query is successful, then returns the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createFamilyForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.constant.error.value.MISSING);
  }

  const familyAccountCreationDate = new Date();
  const familyId = hash(userId, familyAccountCreationDate.toISOString());

  if (areAllDefined(familyAccountCreationDate, familyId) === false) {
    throw new ValidationError('familyAccountCreationDate or familyId missing', global.constant.error.value.MISSING);
  }

  // check if the user is already in a family
  const existingFamilyResult = await getFamilyMemberUserIdForUserId(databaseConnection, userId);

  // validate that the user is not in a family
  if (existingFamilyResult.length !== 0) {
    throw new ValidationError('User is already in a family', global.constant.error.family.join.IN_FAMILY_ALREADY);
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

  return familyId;
}

module.exports = { createFamilyForUserId };
