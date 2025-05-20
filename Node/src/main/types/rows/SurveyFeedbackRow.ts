const surveyFeedbackColumns = `
sfr.surveyFeedbackId,
sfr.userId,
sfr.familyId,
sfr.surveyFeedbackDate,
sfr.surveyFeedbackType,
sfr.surveyFeedbackDeviceMetricModel,
sfr.surveyFeedbackDeviceMetricSystemVersion,
sfr.surveyFeedbackDeviceMetricAppVersion,
sfr.surveyFeedbackDeviceMetricLocale
`;

type SurveyFeedbackRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    surveyFeedbackId: number
    userId: string
    familyId: string
    surveyFeedbackDate: Date
    surveyFeedbackType: string
    surveyFeedbackDeviceMetricModel: string
    surveyFeedbackDeviceMetricSystemVersion: string
    surveyFeedbackDeviceMetricAppVersion: string
    surveyFeedbackDeviceMetricLocale: string
};

type NotYetCreatedSurveyFeedbackRow = Omit<SurveyFeedbackRow, 'surveyFeedbackId' | 'surveyFeedbackDate'>;

export {
  type SurveyFeedbackRow,
  type NotYetCreatedSurveyFeedbackRow,
  surveyFeedbackColumns,
};
