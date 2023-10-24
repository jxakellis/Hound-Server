import express from 'express';

import {
  getLogs, createLog, updateLog, deleteLog,
} from '../controllers/controllerRoutes/logs.js';
import { validateLogId } from '../main/tools/validate/validateId.js';

const logsRouter = express.Router({ mergeParams: true });

logsRouter.param('logId', validateLogId);

logsRouter.get('/', getLogs);
logsRouter.get('/:logId', getLogs);

logsRouter.post('/', createLog);

logsRouter.put('/:logId', updateLog);

logsRouter.delete('/:logId', deleteLog);

export { logsRouter };
