import express from 'express';

import {
  getTriggers, createTrigger, updateTrigger, deleteTrigger,
} from '../controllers/controllerRoutes/triggers.js';
import { validateTriggerUUID } from '../main/tools/validate/validateDogRelatedId.js';

const triggersRouter = express.Router({ mergeParams: true });

triggersRouter.use(['/'], validateTriggerUUID);

triggersRouter.get(['/'], getTriggers);
triggersRouter.patch(['/'], getTriggers);

triggersRouter.post(['/'], createTrigger);

triggersRouter.put(['/'], updateTrigger);

triggersRouter.delete(['/'], deleteTrigger);

export { triggersRouter };
