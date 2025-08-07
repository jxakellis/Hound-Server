import express from 'express';
import { ERROR_CODES, HoundError } from '../../../../../main/server/globalErrors.js';

import { formatUnknownString, formatNumber } from '../../../../../main/format/formatObject.js';
import { createSurveyFeedbackForSurveyFeedback } from '../../../../create/createSurveyFeedback.js';
import { SurveyFeedbackType } from '../../../../../main/enums/SurveyFeedbackType.js';

async function createSurveyFeedback(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserId, authFamilyId } = req.houndProperties.authenticated;
    const { unauthSurveyFeedbackDict } = req.houndProperties.unauthenticated;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', createSurveyFeedback, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (authFamilyId === undefined || authFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createSurveyFeedback, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (unauthSurveyFeedbackDict === undefined || unauthSurveyFeedbackDict === null) {
      throw new HoundError('unauthSurveyFeedbackDict missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }

    const surveyFeedbackType = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackType']);

    if (surveyFeedbackType === undefined || surveyFeedbackType === null) {
      throw new HoundError('surveyFeedbackType missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }

    switch (surveyFeedbackType) {
      case SurveyFeedbackType.cancelSubscription:
      case SurveyFeedbackType.appExperience:
        break;
      default:
        throw new HoundError(`surveyFeedbackType of '${surveyFeedbackType}' invalid`, createSurveyFeedback, ERROR_CODES.VALUE.INVALID);
    }

    // Survey Feedback Device Metrics
    const surveyFeedbackDeviceMetricModel = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackDeviceMetricModel']);
    const surveyFeedbackDeviceMetricSystemVersion = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackDeviceMetricSystemVersion']);
    const surveyFeedbackDeviceMetricAppVersion = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackDeviceMetricAppVersion']);
    const surveyFeedbackDeviceMetricLocale = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackDeviceMetricLocale']);

    if (surveyFeedbackDeviceMetricModel === undefined || surveyFeedbackDeviceMetricModel === null) {
      throw new HoundError('surveyFeedbackDeviceMetricModel missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }
    if (surveyFeedbackDeviceMetricSystemVersion === undefined || surveyFeedbackDeviceMetricSystemVersion === null) {
      throw new HoundError('surveyFeedbackDeviceMetricSystemVersion missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }
    if (surveyFeedbackDeviceMetricAppVersion === undefined || surveyFeedbackDeviceMetricAppVersion === null) {
      throw new HoundError('surveyFeedbackDeviceMetricAppVersion missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }
    if (surveyFeedbackDeviceMetricLocale === undefined || surveyFeedbackDeviceMetricLocale === null) {
      throw new HoundError('surveyFeedbackDeviceMetricLocale missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }

    // Survey Feedback User Cancellation Specifics
    const activeSubscriptionTransactionId = req.houndProperties.authenticated.authFamilyActiveSubscription?.transactionId;
    const surveyFeedbackUserCancellationReason = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackUserCancellationReason']);
    const surveyFeedbackUserCancellationFeedback = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackUserCancellationFeedback']) ?? '';

    // Survey Feedback App Experience Specifics
    const surveyFeedbackAppExperienceNumberOfStars = formatNumber(unauthSurveyFeedbackDict?.['surveyFeedbackAppExperienceNumberOfStars']);
    const surveyFeedbackAppExperienceFeedback = formatUnknownString(unauthSurveyFeedbackDict?.['surveyFeedbackAppExperienceFeedback']) ?? '';

    await createSurveyFeedbackForSurveyFeedback(
      databaseConnection,
      {
        userId: authUserId,
        familyId: authFamilyId,
        surveyFeedbackType,
        surveyFeedbackDeviceMetricModel,
        surveyFeedbackDeviceMetricSystemVersion,
        surveyFeedbackDeviceMetricAppVersion,
        surveyFeedbackDeviceMetricLocale,
        activeSubscriptionTransactionId,
        surveyFeedbackUserCancellationReason,
        surveyFeedbackUserCancellationFeedback,
        surveyFeedbackAppExperienceNumberOfStars,
        surveyFeedbackAppExperienceFeedback,
      },
    );

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  createSurveyFeedback,
};
