import { Queryable, databaseQuery } from '../../main/database/databaseQuery';

/**
 * Queries all the tables to check if they are on line
 *  If the query is successful, returns
 *  If a problem is encountered, creates and throws custom error
 */
async function getDatabaseStatusForWatchdog(databaseConnection: Queryable): Promise<void> {
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
