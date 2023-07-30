const { databaseQuery } = require('../database/databaseQuery');
const { areAllDefined } = require('../format/validateDefined');

// Makes a code for a family to use that consists of A-Z and 0-9
const generateFamilyCode = () => {
  let familyCode = '';
  // O and 0 + L and I are all removed because they look similar
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';
  const charactersLength = characters.length;
  const familyCodeLength = 8;

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  for (let i = 0; i < familyCodeLength; i += 1) {
    familyCode += characters.charAt(getRandomInt(charactersLength));
  }

  // TODO FUTURE add swear word filter to auto code generator

  return familyCode;
};

// Generate a verified unique code for a family to use that consists of A-Z and 0-9 (excludes I, L, O, and 0 due to how similar they look)
async function generateVerifiedFamilyCode(databaseConnection) {
  if (areAllDefined(databaseConnection) === false) {
    return undefined;
  }

  let uniqueFamilyCode;
  while (areAllDefined(uniqueFamilyCode) === false) {
    const potentialFamilyCode = generateFamilyCode();
    // Necessary to disable no-await-in-loop as we can't use Promise.all() for a while loop. We have a unknown amount of promises
    // eslint-disable-next-line no-await-in-loop
    const result = await databaseQuery(
      databaseConnection,
      `SELECT 1
      FROM families f
      WHERE familyCode = ?
      LIMIT 1`,
      [potentialFamilyCode],
    );
    // if the result's length is zero, that means there wasn't a match for the family code and the code is unique
    if (result.length === 0) {
      uniqueFamilyCode = potentialFamilyCode;
    }
  }
  return uniqueFamilyCode;
}

module.exports = { generateVerifiedFamilyCode };
