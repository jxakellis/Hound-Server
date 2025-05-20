import express from 'express';
import { getTypes } from '../../../controllers/controllerRoutes/app/types.js';

const typesRouter = express.Router({ mergeParams: true });

typesRouter.get(['/'], getTypes);
typesRouter.patch(['/'], getTypes);

export { typesRouter };
