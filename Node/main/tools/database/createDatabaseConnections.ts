import mysql2 from 'mysql2';
import {
  developmentHoundUser,
  developmentHoundHost,
  developmentHoundPassword,
  developmentHoundDatabase,
  productionHoundUser,
  productionHoundHost,
  productionHoundPassword,
  productionHoundDatabase,
} from '../../secrets/databaseConnection';

import { SERVER } from '../../server/globalConstants';

const user = SERVER.IS_PRODUCTION_DATABASE ? productionHoundUser : developmentHoundUser;
const host = SERVER.IS_PRODUCTION_DATABASE ? productionHoundHost : developmentHoundHost;
const password = SERVER.IS_PRODUCTION_DATABASE ? productionHoundPassword : developmentHoundPassword;
const database = SERVER.IS_PRODUCTION_DATABASE ? productionHoundDatabase : developmentHoundDatabase;
const connectTimeout = 30000;
const databaseConnectionConfiguration = {
  user,
  host,
  password,
  database,
  connectTimeout,
};

const databaseConnectionForGeneral = mysql2.createConnection(databaseConnectionConfiguration);

const databaseConnectionForLogging = mysql2.createConnection(databaseConnectionConfiguration);

const databaseConnectionForAlarms = mysql2.createConnection(databaseConnectionConfiguration);

/// the pool used by users when quering the database for their requests
const databaseConnectionPoolForRequests = mysql2.createPool({
  user,
  host,
  password,
  database,
  // Determines the pool's action when no databaseConnections are available and the limit has been reached.
  // If true, the pool will queue the databaseConnection request and call it when one becomes available.
  // If false, the pool will immediately call back with an error.
  waitForConnections: true,
  // The maximum number of databaseConnection requests the pool will queue before returning an error from getConnection.
  // If set to 0, there is no limit to the number of queued databaseConnection requests.
  queueLimit: 0,
  // The maximum number of databaseConnections to create at once.
  connectionLimit: 10,
  connectTimeout: 10000,
});

export {
  databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
};
