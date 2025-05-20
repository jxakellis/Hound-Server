import express from 'express';

import {
  createSurveyFeedback,
} from '../../../../controllers/controllerRoutes/app/user/family/surveyFeedback.js';
import { attachSurveyFeedback } from '../../../../main/tools/validate/attachSurveyFeedback.js';

const surveyFeedbackRouter = express.Router({ mergeParams: true });

surveyFeedbackRouter.use(['/'], attachSurveyFeedback);

surveyFeedbackRouter.post(['/'], createSurveyFeedback);

export { surveyFeedbackRouter };
