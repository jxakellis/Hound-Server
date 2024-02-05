const surveyFeedbackAppExperienceColumns = `
sfae.surveyFeedbackId,
sfae.surveyFeedbackDate,
sfae.userId,
sfae.familyId,
sfae.activeSubscriptionTransactionId,
sfae.userCancellationReason,
sfae.userCancellationFeedback
`;

type SurveyFeedbackAppExperienceRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    surveyFeedbackId: number
    surveyFeedbackDate: Date
    userId: string
    familyId: string
    appExperienceNumberOfStars: number
    appExperienceFeedback: string
};

type NotYetCreatedSurveyFeedbackAppExperienceRow= Omit<SurveyFeedbackAppExperienceRow, 'surveyFeedbackId' | 'surveyFeedbackDate'>;

export {
  type SurveyFeedbackAppExperienceRow,
  type NotYetCreatedSurveyFeedbackAppExperienceRow,
  surveyFeedbackAppExperienceColumns,
};
