const { databaseQuery } = require('../../main/tools/database/databaseQuery');
const { areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

/**
 * Queries all the tables to check if they are on line
 *  If the query is successful, returns
 *  If a problem is encountered, creates and throws custom error
 */
async function getDatabaseStatusForWatchdog(databaseConnection) {
  if (areAllDefined(databaseConnection) === false) {
    throw new ValidationError('databaseConnection missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const tablesToCheck = [
    'dogs',
    'transactions',
    'users',
  ];

  const promises = [];
  for (let i = 0; i < tablesToCheck.length; i += 1) {
    promises.push(databaseQuery(
      databaseConnection,
      `SELECT 1 FROM ${tablesToCheck[i]} LIMIT 1`,
    ));
  }

  await Promise.all(promises);
}

module.exports = {
  getDatabaseStatusForWatchdog,
};
