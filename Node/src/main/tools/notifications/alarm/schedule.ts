// for all scheduled items. Cannot create multiple separate schedulers.
import schedule from 'node-schedule';
import events from 'events';
import { LIMIT } from '../../../server/globalConstants.js';

const eventEmitter: typeof events = events.EventEmitter;

eventEmitter.defaultMaxListeners = LIMIT.NUMBER_OF_SCHEDULED_JOBS_ALLOWED;

export { schedule };
