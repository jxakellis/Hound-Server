import express from 'express';
import { getGlobalTypes } from '../../../controllers/controllerRoutes/app/globalTypes.js';

const globalTypesRouter = express.Router({ mergeParams: true });

globalTypesRouter.get(['/'], getGlobalTypes);
globalTypesRouter.patch(['/'], getGlobalTypes);

export { globalTypesRouter };
