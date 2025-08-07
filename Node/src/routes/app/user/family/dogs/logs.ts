import express from 'express';

import {
  getLogs, createLog, updateLog, deleteLog,
} from '../../../../../controllers/controllerRoutes/app/user/family/dogs/logs.js';
import { validateLogUUID } from '../../../../../main/tools/validate/validateDogRelatedId.js';

const logsRouter = express.Router({ mergeParams: true });

logsRouter.use(['/'], validateLogUUID);

logsRouter.get(['/'], getLogs);
logsRouter.patch(['/'], getLogs);

logsRouter.post(['/'], createLog);

logsRouter.put(['/'], updateLog);

logsRouter.delete(['/'], deleteLog);

export { logsRouter };
