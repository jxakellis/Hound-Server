//
//
// Import modules to create the server
//
//

import { exec } from 'child_process';
import https from 'https';
import express from 'express';

// Import the global constant values to instantiate them
import { SERVER } from './globalConstants.js';
import './globalDeclare';

import { serverLogger } from '../logging/loggers.js';
import { key, cert } from '../secrets/houndOrganizerHTTPS.js';

//
//
// Configure the server to recieve requests
//
//

import { configureServer } from './configureServer.js';
import { configureApp } from './configureApp.js';

//
//
// Configure the server to handle a shutdown
//
//

import { logServerError } from '../logging/logServerError.js';
import { schedule } from '../tools/notifications/alarm/schedule.js';
import {
  getDatabaseConnections,
} from '../database/databaseConnections.js';
import { HoundError } from './globalErrors.js';

// Initialize the express engine
const app: express.Application = express();

//
//
// Create the server
//
//

// Create a NodeJS HTTPS listener on port that points to the Express app
https.createServer();
const httpsServer = https.createServer({
  key,
  cert,
}, app);

// Setup the server to process requests
const testDatabaseConnectionInterval = await configureServer(httpsServer);

// Setup the app to process requests
configureApp(app);

/**
 * Gracefully closes/ends everything
 * This includes the databaseConnection pool for the database for general requests, the databaseConnection for server notifications, the server itself, and the notification schedule
 */
async function shutdown(): Promise<void> {
  const {
    databaseConnectionForGeneral, databaseConnectionForLogging, databaseConnectionForAlarms, databaseConnectionPoolForRequests,
  } = await getDatabaseConnections();

  return new Promise((resolve) => {
    serverLogger.info('Shutdown Initiated');

    const numberOfShutdownsNeeded = 6;
    let numberOfShutdownsCompleted = 0;

    if (testDatabaseConnectionInterval !== undefined) {
      clearInterval(testDatabaseConnectionInterval);
    }

    function checkForShutdownCompletion(): void {
      if (numberOfShutdownsCompleted === numberOfShutdownsNeeded) {
        serverLogger.info('Shutdown Complete');
        resolve();
      }
    }

    schedule.gracefulShutdown()
      .then(() => {
        serverLogger.info('Schedule Gracefully Shutdown');
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
        serverLogger.info('Server Gracefully Shutdown');
      }
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });

    databaseConnectionForGeneral.end((error) => {
      if (error) {
        serverLogger.info('General Database Connection Couldn\'t Shutdown', error);
      }
      else {
        serverLogger.info('General Database Connection Gracefully Shutdown');
      }
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });

    databaseConnectionForLogging.end((error) => {
      if (error) {
        serverLogger.info('Logging Database Connection Couldn\'t Shutdown', error);
      }
      else {
        serverLogger.info('Logging Database Connection Gracefully Shutdown');
      }
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });

    databaseConnectionForAlarms.end((error) => {
      if (error) {
        serverLogger.info('Alarms Database Connection Couldn\'t Shutdown', error);
      }
      else {
        serverLogger.info('Alarms Database Connection Gracefully Shutdown');
      }
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });

    databaseConnectionPoolForRequests.end((error) => {
      if (error) {
        serverLogger.info('Pool For Requests Couldn\'t Shutdown', error);
      }
      else {
        serverLogger.info('Pool For Requests Gracefully Shutdown');
      }
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });
  });
}

process.on('SIGTERM', async () => {
  serverLogger.info('SIGTERM');
  await shutdown();
});

process.on('SIGINT', async () => {
  // manual kill with ^C
  serverLogger.info('SIGINT');
  await shutdown();
});

process.on('SIGUSR2', async () => {
  // nodemon restart
  serverLogger.info('SIGUSR2');
  await shutdown();
});

process.on('uncaughtException', async (error, origin) => {
  // uncaught error happened somewhere
  serverLogger.info(`Uncaught exception from origin: ${origin}`);
  // Specifically await logServerError here to ensure that the error is logged before the server shuts down
  await logServerError(
    new HoundError(
      'uncaughtException',
      shutdown,
      undefined,
      error,
    ),
  );
  await shutdown()
    .catch((shutdownError) => serverLogger.error(`Experienced error while attempting to shutdown (shutdown): ${shutdownError}`));

  if (error.message || error.stack || error.name || error.cause || error.houndDeclarationCode === 'EADDRINUSE') {
    /**
   * The previous Node Application did not shut down properly
   * process.on('exit', ...) isn't called when the process crashes or is killed.
   */
    exec(`npx kill-port ${SERVER.SERVER_PORT}`, () => {
      serverLogger.info(`EADDRINUSE; Process(es) on port ${SERVER.SERVER_PORT} killed`);
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
