const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { generateVerifiedFamilyCode } = require('../../main/tools/general/generateVerifiedFamilyCode');
const { ValidationError } = require('../../main/tools/general/errors');
const { hash } = require('../../main/tools/format/hash');
const { areAllDefined } = require('../../main/tools/validate/validateDefined');

const { isUserIdInFamily } = require('../getFor/getForFamily');

/**
 *  Queries the database to create a family. If the query is successful, then returns the familyId.
 *  If a problem is encountered, creates and throws custom error
 */
async function createFamilyForUserId(databaseConnection, userId) {
  if (areAllDefined(databaseConnection, userId) === false) {
    throw new ValidationError('databaseConnection or userId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const familyId = hash(userId);

  if (areAllDefined(familyId) === false) {
    throw new ValidationError('familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  // check if the user is already in a family
  const isUserInFamily = await isUserIdInFamily(databaseConnection, userId);

  // validate that the user is not in a family
  if (isUserInFamily === true) {
    throw new ValidationError('User is already in a family', global.CONSTANT.ERROR.FAMILY.JOIN.IN_FAMILY_ALREADY);
  }

  // create a family code for the new family
  const familyCode = await generateVerifiedFamilyCode(databaseConnection);

  const promises = [
    databaseQuery(
      databaseConnection,
      `INSERT INTO families
      (userId, familyId, familyCode, familyIsLocked, familyAccountCreationDate)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())`,
      [userId, familyId, familyCode, false],
    ),
    databaseQuery(
      databaseConnection,
      `INSERT INTO familyMembers
      (userId, familyId, familyMemberJoinDate)
      VALUES (?, ?, CURRENT_TIMESTAMP())`,
      [userId, familyId],
    ),
  ];

  await Promise.all(promises);

  return familyId;
}

module.exports = { createFamilyForUserId };
