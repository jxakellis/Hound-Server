import { Queryable, databaseQuery } from './databaseQuery';
import { serverLogger } from '../logging/loggers';

/// Performs basic query on user table to establish if the databaseConnection is valid
async function testDatabaseConnection(databaseConnection: Queryable): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `SELECT 1
    FROM users u
    LIMIT 1`,
  );

  serverLogger.info(`databaseConnection with thread id ${databaseConnection.threadId} verified as connected`);
}

export {
  testDatabaseConnection,
};
