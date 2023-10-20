import { type Queryable, databaseQuery } from './databaseQuery.js';
import { serverLogger } from '../logging/loggers.js';

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

    if (databaseConnection !== undefined && databaseConnection !== null) {
      promises.push(testDatabaseConnection(databaseConnection));
    }
  }

  await Promise.all(promises);
}

export {
  testDatabaseConnection, testDatabaseConnections,
};
