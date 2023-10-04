//
//
// Import modules to create the server
//
//

// Import the global constant values to instantiate them
import './globalConstants';
import './globalDeclare';

// Import module required to execute console commands
import { exec } from 'child_process';

// Import builtin NodeJS modules to instantiate the server
import * as https from 'https'

// Import the express module
import express from 'express';
 
// Initialize the express engine
const app: express.Application = express();

import { serverLogger } from '../tools/logging/loggers';
import { key, cert } from '../secrets/houndOrganizerHTTPS';

//
//
// Create the server
//
//

// Create a NodeJS HTTPS listener on port that points to the Express app
https.createServer()
const httpsServer = https.createServer({
  key,
  cert,
}, app);

//
//
// Configure the server to recieve requests
//
//

const { configureServerForRequests } from './configureServer';
const { configureAppForRequests } from './configureApp';

// Setup the server to process requests
let testDatabaseConnectionInterval;
configureServerForRequests(httpsServer).then((intervalObject) => {
  testDatabaseConnectionInterval = intervalObject;
});

// Setup the app to process requests
configureAppForRequests(app);

//
//
// Configure the server to handle a shutdown
//
//

const { logServerError } from '../tools/logging/logServerError';
const { areAllDefined } from '../tools/validate/validateDefined';
const { schedule } from '../tools/notifications/alarm/schedule';
const {
  databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
} = require('../tools/database/createDatabaseConnections';

/**
 * Gracefully closes/ends everything
 * This includes the databaseConnection pool for the database for general requests, the databaseConnection for server notifications, the server itself, and the notification schedule
 */
const shutdown = () => new Promise((resolve) => {
  serverLogger.info('Shutdown Initiated';

  const numberOfShutdownsNeeded = 6;
  let numberOfShutdownsCompleted = 0;

  if (areAllDefined(testDatabaseConnectionInterval)) {
    clearInterval(testDatabaseConnectionInterval);
  }

  schedule.gracefulShutdown()
    .then(() => {
      serverLogger.info('Schedule Gracefully Shutdown';
    })
    .catch((error) => {
      serverLogger.error('Schedule Couldn\'t Shutdown', error);
    })
    .finally(() => {
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });

  httpsServer.close((error) => {
    if (error) {
      serverLogger.info('Server Couldn\'t Shutdown', error);
    }
    else {
      serverLogger.info('Server Gracefully Shutdown';
    }
    numberOfShutdownsCompleted += 1;
    checkForShutdownCompletion();
  });

  databaseConnectionForGeneral.end((error) => {
    if (error) {
      serverLogger.info('General Database Connection Couldn\'t Shutdown', error);
    }
    else {
      serverLogger.info('General Database Connection Gracefully Shutdown';
    }
    numberOfShutdownsCompleted += 1;
    checkForShutdownCompletion();
  });

  databaseConnectionForLogging.end((error) => {
    if (error) {
      serverLogger.info('Logging Database Connection Couldn\'t Shutdown', error);
    }
    else {
      serverLogger.info('Logging Database Connection Gracefully Shutdown';
    }
    numberOfShutdownsCompleted += 1;
    checkForShutdownCompletion();
  });

  databaseConnectionForAlarms.end((error) => {
    if (error) {
      serverLogger.info('Alarms Database Connection Couldn\'t Shutdown', error);
    }
    else {
      serverLogger.info('Alarms Database Connection Gracefully Shutdown';
    }
    numberOfShutdownsCompleted += 1;
    checkForShutdownCompletion();
  });

  databaseConnectionPoolForRequests.end((error) => {
    if (error) {
      serverLogger.info('Pool For Requests Couldn\'t Shutdown', error);
    }
    else {
      serverLogger.info('Pool For Requests Gracefully Shutdown';
    }
    numberOfShutdownsCompleted += 1;
    checkForShutdownCompletion();
  });

  function checkForShutdownCompletion() {
    if (numberOfShutdownsCompleted === numberOfShutdownsNeeded) {
      serverLogger.info('Shutdown Complete';
      resolve();
    }
  }
});

process.on('SIGTERM', async () => {
  serverLogger.info('SIGTERM';
  await shutdown();
});

process.on('SIGINT', async () => {
  // manual kill with ^C
  serverLogger.info('SIGINT';
  await shutdown();
});

process.on('SIGUSR2', async () => {
  // nodemon restart
  serverLogger.info('SIGUSR2';
  await shutdown();
});

process.on('uncaughtException', async (error, origin) => {
  // uncaught error happened somewhere
  serverLogger.info(`Uncaught exception from origin: ${origin}`);
  // Specifically await logServerError here to ensure that the error is logged before the server shuts down
  await logServerError('uncaughtException', error)
    .catch((shutdownError) => serverLogger.error(`Experienced error while attempting to shutdown (logServerError): ${shutdownError}`));
  await shutdown()
    .catch((shutdownError) => serverLogger.error(`Experienced error while attempting to shutdown (shutdown): ${shutdownError}`));

  if (error.code === 'EADDRINUSE') {
    /**
   * The previous Node Application did not shut down properly
   * process.on('exit', ...) isn't called when the process crashes or is killed.
   */
    exec(`npx kill-port ${global.CONSTANT.SERVER.SERVER_PORT}`, () => {
      serverLogger.info(`EADDRINUSE; Process(es) on port ${global.CONSTANT.SERVER.SERVER_PORT} killed`);
      process.exit(1);
    });
    return;
  }

  process.exit(1);
});

process.on('uncaughtRejection', async (reason, promise) => {
  // uncaught rejection of a promise happened somewhere
  serverLogger.info(`Uncaught rejection of promise: ${promise}`, `reason: ${reason}`);
});
