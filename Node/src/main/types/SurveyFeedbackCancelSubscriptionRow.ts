const surveyFeedbackCancelSubscriptionColumns = `
sfcs.surveyFeedbackId,
sfcs.surveyFeedbackDate,
sfcs.userId,
sfcs.familyId,
sfcs.activeSubscriptionTransactionId,
sfcs.userCancellationReason,
sfcs.userCancellationFeedback
`;

type SurveyFeedbackCancelSubscriptionRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    surveyFeedbackId: number
    surveyFeedbackDate: Date
    userId: string
    familyId: string
    activeSubscriptionTransactionId?: number
    userCancellationReason?: string
    userCancellationFeedback: string
};

type NotYetCreatedSurveyFeedbackCancelSubscriptionRow = Omit<SurveyFeedbackCancelSubscriptionRow, 'surveyFeedbackId' | 'surveyFeedbackDate'>;

export {
  type SurveyFeedbackCancelSubscriptionRow,
  type NotYetCreatedSurveyFeedbackCancelSubscriptionRow,
  surveyFeedbackCancelSubscriptionColumns,
};
