const surveyFeedbackAppExperienceColumns = `
sfae.surveyFeedbackId,
sfae.surveyFeedbackAppExperienceNumberOfStars,
sfae.surveyFeedbackAppExperienceFeedback
`;

type SurveyFeedbackAppExperienceRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    surveyFeedbackId: number
    surveyFeedbackAppExperienceNumberOfStars: number
    surveyFeedbackAppExperienceFeedback: string
};

type NotYetCreatedSurveyFeedbackAppExperienceRow= Omit<SurveyFeedbackAppExperienceRow, 'surveyFeedbackId'>;

export {
  type SurveyFeedbackAppExperienceRow,
  type NotYetCreatedSurveyFeedbackAppExperienceRow,
  surveyFeedbackAppExperienceColumns,
};
