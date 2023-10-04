const { databaseQuery } from '../../main/tools/database/databaseQuery';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/tools/general/errors';

/**
 * Queries all the tables to check if they are on line
 *  If the query is successful, returns
 *  If a problem is encountered, creates and throws custom error
 */
async function getDatabaseStatusForWatchdog(databaseConnection) {
  if (areAllDefined(databaseConnection) === false) {
    throw new ValidationError('databaseConnection missing', global.CONSTANT.ERROR.VALUE.MISSING);
  }

  const promises = [
    databaseQuery(
      databaseConnection,
      `SELECT 1
      FROM users u
      LIMIT 1`,
    ),
    databaseQuery(
      databaseConnection,
      `SELECT 1
      FROM dogs d
      LIMIT 1`,
    ),
  ];

  await Promise.all(promises);
}

export {
  getDatabaseStatusForWatchdog,
};
