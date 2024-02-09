const surveyFeedbackCancelSubscriptionColumns = `
sfcs.surveyFeedbackId,
sfcs.activeSubscriptionTransactionId,
sfcs.surveyFeedbackUserCancellationReason,
sfcs.surveyFeedbackUserCancellationFeedback
`;

type SurveyFeedbackCancelSubscriptionRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    surveyFeedbackId: number
    activeSubscriptionTransactionId?: number
    surveyFeedbackUserCancellationReason?: string
    surveyFeedbackUserCancellationFeedback: string
};

type NotYetCreatedSurveyFeedbackCancelSubscriptionRow= Omit<SurveyFeedbackCancelSubscriptionRow, 'surveyFeedbackId'>;

export {
  type SurveyFeedbackCancelSubscriptionRow,
  type NotYetCreatedSurveyFeedbackCancelSubscriptionRow,
  surveyFeedbackCancelSubscriptionColumns,
};
