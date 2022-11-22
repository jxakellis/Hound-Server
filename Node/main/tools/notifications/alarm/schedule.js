// for all scheduled items. Cannot create multiple seperate schedulers.
const schedule = require('node-schedule');
const eventEmitter = require('events').EventEmitter;

eventEmitter.defaultMaxListeners = global.CONSTANT.LIMIT.NUMBER_OF_SCHEDULED_JOBS_ALLOWED;

module.exports = {
  schedule,
};
