import express from 'express';

import {
  getLogs, createLog, updateLog, deleteLog,
  createLogLike,
  deleteLogLike,
} from '../../../../../controllers/controllerRoutes/app/user/family/dogs/logs.js';
import { validateLogUUID } from '../../../../../main/tools/validate/validateDogRelatedId.js';

const logsRouter = express.Router({ mergeParams: true });

logsRouter.use(['/'], validateLogUUID);
logsRouter.use(['/', '/like'], validateLogUUID);

logsRouter.get(['/'], getLogs);
logsRouter.patch(['/'], getLogs);

logsRouter.post(['/'], createLog);
logsRouter.post(['/like'], createLogLike);

logsRouter.put(['/'], updateLog);

logsRouter.delete(['/'], deleteLog);
logsRouter.delete(['/like'], deleteLogLike);

export { logsRouter };
