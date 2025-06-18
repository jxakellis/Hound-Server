import { exec } from 'child_process';
import https from 'https';
import http from 'http';
import type { Server as HTTPServer } from 'http';
import type { Server as HTTPSServer } from 'https';
import express from 'express';
import { SERVER } from './globalConstants.js';
import './globalDeclare.js';
import { serverLogger } from '../logging/loggers.js';
import { key, cert } from '../secrets/houndOrganizerHTTPS.js';
import { configureServer } from './configureServer.js';
import { configureApp } from './configureApp.js';
import { logServerError } from '../logging/logServerError.js';
import { schedule } from '../tools/notifications/alarm/schedule.js';
import { endDatabasePools } from '../database/databaseConnections.js';
import { HoundError } from './globalErrors.js';

// TODO FUTURE NICE-TO-HAVE add a maintaince server entry point for the server. This will run when main server is down for changes

let httpsServer: HTTPServer | HTTPSServer | null = null;
let testDatabaseConnectionInterval: NodeJS.Timeout | null;

// This prevents multiple shutdowns from occurring at once
let shutdownInProgress = false;
/**
 * Gracefully closes/ends everything
 * This includes the databaseConnection pool for the database for general requests, the databaseConnection for server notifications, the server itself, and the notification schedule
 */
async function shutdown(): Promise<void> {
  if (shutdownInProgress === true) {
    return new Promise((resolve) => {
      resolve();
    });
  }
  shutdownInProgress = true;

  return new Promise(() => {
    serverLogger.info('Shutdown Initiated');

    const numberOfShutdownsNeeded = 3;
    let numberOfShutdownsCompleted = 0;

    if (testDatabaseConnectionInterval !== null) {
      serverLogger.info('Cleared Interval for testDatabaseConnectionInterval');
      clearInterval(testDatabaseConnectionInterval);
    }

    function checkForShutdownCompletion(): void {
      serverLogger.info(`${numberOfShutdownsCompleted}/${numberOfShutdownsNeeded} Shutdown Steps Complete`);
      if (numberOfShutdownsCompleted === numberOfShutdownsNeeded) {
        serverLogger.info('All Shutdown Steps Complete');

        /**
        * The previous Node Application did not shut down properly
        * process.on('exit', ...) isn't called when the process crashes or is killed.
        */
        exec(`npx kill-port ${SERVER.SERVER_PORT}`, () => {
          serverLogger.info(`All processes on port ${SERVER.SERVER_PORT} absolutely killed and obliterated GTFO`);
          process.exit(1);
        });
      }
    }

    schedule.gracefulShutdown()
      .then(() => {
        serverLogger.info('\'schedule\' Gracefully Shutdown');
      })
      .catch((error) => {
        serverLogger.error('\'schedule\' Couldn\'t Be Shutdown', error);
      })
      .finally(() => {
        numberOfShutdownsCompleted += 1;
        checkForShutdownCompletion();
      });

    httpsServer?.close((error) => {
      if (error !== undefined && error !== null) {
        serverLogger.info('\'httpsServer\' Couldn\'t Be Closed', error);
      }
      else {
        serverLogger.info('\'httpsServer\' Gracefully Closed');
      }
      numberOfShutdownsCompleted += 1;
      checkForShutdownCompletion();
    });

    endDatabasePools().finally(() => {
      serverLogger.info('\'endDatabasePools\' Completed (either successfully or unsuccessfully)');
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
  // Specifically await logServerError here to ensure that the error is logged before the server shuts down
  await logServerError(
    new HoundError(
      `uncaughtException from origin: ${origin}`,
      process.on,
      undefined,
      error,
    ),
  );

  await shutdown();
});

process.on('uncaughtRejection', async (reason, promise) => {
  // uncaught rejection of a promise happened somewhere
  serverLogger.info(`Uncaught rejection of promise: ${promise}`, `reason: ${reason}`);
});

// Initialize the express engine
const app: express.Application = express();

// Create a NodeJS HTTPS listener on port that points to the Express app
httpsServer = false
  ? http.createServer(app)
  : https.createServer({
    key,
    cert,
  }, app);

httpsServer.on('error', async (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    serverLogger.error(`httpsServer error: Port ${SERVER.SERVER_PORT} is already in use.`);
  }
  else {
    serverLogger.error('httpsServer error: ', error);
  }
  await shutdown();
});

// Setup the server to process requests
testDatabaseConnectionInterval = await configureServer(httpsServer);

// Setup the app to process requests
configureApp(app);
