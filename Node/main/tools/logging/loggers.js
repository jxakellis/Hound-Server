const parentLogger = require('pino')();

// Important server state information. This should always be logged to the console as it indicates critical functions
const serverLogger = parentLogger.child({ name: 'Server' });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
serverLogger.level = 'trace';

// trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60, silent: infinity
// The silent logging level is a specialized level which will disable all logging, the silent log method is a noop function.
const level = global.constant.server.CONSOLE_LOGGING_ENABLED === true ? 'debug' : 'silent';

// API Requests from users
const requestLogger = parentLogger.child({ name: 'Request', level });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
requestLogger.level = level;

// API Responses sent to users
const responseLogger = parentLogger.child({ name: 'Response', level });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
responseLogger.level = level;

// Pool connecion aquision and release for requests
const poolLogger = parentLogger.child({ name: 'Pool', level });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
poolLogger.level = level;

// Alarms and scheduling events (e.g. scheduling job for reminder)
const alarmLogger = parentLogger.child({ name: 'Alarm', level });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
alarmLogger.level = level;

// General APN alerts (e.g. someone logged Poty for Fido)
const alertLogger = parentLogger.child({ name: 'Alert', level });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
alertLogger.level = level;

// Sending an APN
const apnLogger = parentLogger.child({ name: 'APN', level });
// Passing 'level' as an option doesn't configure the logger as it should. Have to set manually
apnLogger.level = level;

module.exports = {
  serverLogger, requestLogger, responseLogger, poolLogger, alarmLogger, alertLogger, apnLogger,
};
