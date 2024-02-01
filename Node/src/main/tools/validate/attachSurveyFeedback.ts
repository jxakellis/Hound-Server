import express from 'express';

import { type StringKeyDictionary } from '../../types/StringKeyDictionary.js';

async function attachSurveyFeedback(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackDictionary = req.body['surveyFeedback'] as (StringKeyDictionary | undefined);

    if (surveyFeedbackDictionary === undefined || surveyFeedbackDictionary === null) {
      // We have no feedback to attach
      return next();
    }

    req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedSurveyFeedbackDictionary = {
      ...req.houndDeclarationExtendedProperties.unvalidatedVariables.unvalidatedSurveyFeedbackDictionary,
      ...surveyFeedbackDictionary,
    };
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

export {
  attachSurveyFeedback,
};
