import express from 'express';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatUnknownString, formatNumber } from '../../main/format/formatObject.js';
import { createSurveyFeedbackForSurveyFeedback } from '../createFor/createForSurveyFeedback.js';
import { SurveyFeedbackType } from '../../main/enums/SurveyFeedbackType.js';

async function createSurveyFeedback(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    // For certain paths, its ok for validatedIds to be possibly undefined, e.g. getReminders, if validatedReminderIds is undefined, then we use validatedDogId to get all dogs
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId, validatedFamilyId } = req.houndDeclarationExtendedProperties.validatedVariables;
    const { unvalidatedSurveyFeedbackDictionary } = req.houndDeclarationExtendedProperties.unvalidatedVariables;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('No user found or invalid permissions', createSurveyFeedback, ERROR_CODES.PERMISSION.NO.USER);
    }
    if (validatedFamilyId === undefined || validatedFamilyId === null) {
      throw new HoundError('No family found or invalid permissions', createSurveyFeedback, ERROR_CODES.PERMISSION.NO.FAMILY);
    }
    if (unvalidatedSurveyFeedbackDictionary === undefined || unvalidatedSurveyFeedbackDictionary === null) {
      throw new HoundError('unvalidatedSurveyFeedbackDictionary missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackType = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackType']);

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackDeviceMetricModel = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackDeviceMetricModel']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackDeviceMetricSystemVersion = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackDeviceMetricSystemVersion']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackDeviceMetricAppVersion = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackDeviceMetricAppVersion']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackDeviceMetricLocale = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackDeviceMetricLocale']);

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
    const activeSubscriptionTransactionId = req.houndDeclarationExtendedProperties.familyActiveSubscription?.transactionId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackUserCancellationReason = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackUserCancellationReason']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackUserCancellationFeedback = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackUserCancellationFeedback']) ?? '';

    // Survey Feedback App Experience Specifics
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackAppExperienceNumberOfStars = formatNumber(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackAppExperienceNumberOfStars']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const surveyFeedbackAppExperienceFeedback = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['surveyFeedbackAppExperienceFeedback']) ?? '';

    await createSurveyFeedbackForSurveyFeedback(
      databaseConnection,
      {
        userId: validatedUserId,
        familyId: validatedFamilyId,
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

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  createSurveyFeedback,
};