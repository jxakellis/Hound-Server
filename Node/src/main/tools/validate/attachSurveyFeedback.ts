import express from 'express';

import { type StringKeyDict } from '../../types/StringKeyDict.js';

async function attachSurveyFeedback(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackDict = req.body['surveyFeedback'] as (StringKeyDict | undefined);

    if (surveyFeedbackDict === undefined || surveyFeedbackDict === null) {
      // We have no feedback to attach
      return next();
    }

    req.houndProperties.unauthenticated.unauthSurveyFeedbackDict = {
      ...req.houndProperties.unauthenticated.unauthSurveyFeedbackDict,
      ...surveyFeedbackDict,
    };
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }

  return next();
}

export {
  attachSurveyFeedback,
};
