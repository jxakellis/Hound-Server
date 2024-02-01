const surveyFeedbackCancelSubscriptionColumns = `
fcs.feedbackId,
fcs.feedbackDate,
fcs.userId,
fcs.familyId,
fcs.activeSubscriptionTransactionId,
fcs.userCancellationReason,
fcs.userCancellationFeedback
`;

type SurveyFeedbackCancelSubscriptionRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    feedbackId: number
    feedbackDate: Date
    userId: string
    familyId: string
    activeSubscriptionTransactionId?: number
    userCancellationReason?: string
    userCancellationFeedback: string
};

type NotYetCreatedSurveyFeedbackCancelSubscriptionRow = Omit<SurveyFeedbackCancelSubscriptionRow, 'feedbackId' | 'feedbackDate'>;

export {
  type SurveyFeedbackCancelSubscriptionRow,
  type NotYetCreatedSurveyFeedbackCancelSubscriptionRow,
  surveyFeedbackCancelSubscriptionColumns,
};
