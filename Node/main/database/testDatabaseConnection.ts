import { Queryable, databaseQuery } from './databaseQuery';
import { serverLogger } from '../tools/logging/loggers';

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

async function testDatabaseConnections(...databaseConnections: Queryable[]): Promise<void> {
  const promises: Promise<void>[] = [];

  for (let i = 0; i < databaseConnections.length; i += 1) {
    const databaseConnection = databaseConnections.safeIndex(i);

    if (databaseConnection === undefined) {
      continue;
    }
    promises.push(testDatabaseConnection(databaseConnection));
  }

  await Promise.all(promises);
}

export {
  testDatabaseConnection, testDatabaseConnections,
};
