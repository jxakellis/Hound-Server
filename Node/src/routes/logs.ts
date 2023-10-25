import express from 'express';

import {
  getLogs, createLog, updateLog, deleteLog,
} from '../controllers/controllerRoutes/logs.js';
import { validateLogId } from '../main/tools/validate/validateDogRelatedId.js';

const logsRouter = express.Router({ mergeParams: true });

// TODO FUTURE depreciate :logId, last used <= 3.0.0
logsRouter.use(['/:logId', '/'], validateLogId);

logsRouter.get(['/:logId', '/'], getLogs);
logsRouter.patch(['/:logId', '/'], getLogs);

logsRouter.post(['/'], createLog);

logsRouter.put(['/:logId', '/'], updateLog);

logsRouter.delete(['/:logId', '/'], deleteLog);

export { logsRouter };
