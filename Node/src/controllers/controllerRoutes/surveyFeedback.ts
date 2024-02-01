import express from 'express';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatUnknownString } from '../../main/format/formatObject.js';
import { createSurveyFeedbackForCancelSubscription } from '../createFor/createForSurveyFeedback.js';
import { SurveyFeedbackTypes } from '../../main/enums/SurveyFeedbackTypes.js';

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
      case SurveyFeedbackTypes.cancelSubscription:
        break;
      default:
        throw new HoundError(`surveyFeedbackType of '${surveyFeedbackType}' invalid`, createSurveyFeedback, ERROR_CODES.VALUE.INVALID);
    }

    if (surveyFeedbackType === SurveyFeedbackTypes.cancelSubscription) {
      const { familyActiveSubscription } = req.houndDeclarationExtendedProperties;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userCancellationReason = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['userCancellationReason']);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userCancellationFeedback = formatUnknownString(unvalidatedSurveyFeedbackDictionary?.['userCancellationFeedback']) ?? '';

      // activeSubscriptionTransactionId can be missing
      // userCancellationReason can be missing
      if (userCancellationFeedback === undefined || userCancellationFeedback === null) {
        throw new HoundError('userCancellationFeedback missing', createSurveyFeedback, ERROR_CODES.VALUE.MISSING);
      }

      await createSurveyFeedbackForCancelSubscription(
        databaseConnection,
        {
          userId: validatedUserId,
          familyId: validatedFamilyId,
          activeSubscriptionTransactionId: familyActiveSubscription?.transactionId,
          userCancellationReason,
          userCancellationFeedback,
        },
      );
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  createSurveyFeedback,
};
