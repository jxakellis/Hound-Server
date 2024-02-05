import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetCreatedSurveyFeedbackCancelSubscriptionRow } from '../../main/types/SurveyFeedbackCancelSubscriptionRow.js';
import { type NotYetCreatedSurveyFeedbackAppExperienceRow } from '../../main/types/SurveyFeedbackAppExperienceRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';

async function createSurveyFeedbackForCancelSubscription(databaseConnection: Queryable, surveyFeedbackCancelSubscription: NotYetCreatedSurveyFeedbackCancelSubscriptionRow): Promise<void> {
  // If there is a placeholder transactionId, then leave its value as null
  let activeSubscriptionTransactionId: (number | undefined);
  if (surveyFeedbackCancelSubscription.activeSubscriptionTransactionId !== undefined && surveyFeedbackCancelSubscription.activeSubscriptionTransactionId !== null) {
    if (surveyFeedbackCancelSubscription.activeSubscriptionTransactionId >= 0) {
      activeSubscriptionTransactionId = surveyFeedbackCancelSubscription.activeSubscriptionTransactionId;
    }
  }

  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO surveyFeedbackCancelSubscription
      (
        surveyFeedbackDate,
        userId, familyId,
        activeSubscriptionTransactionId,
        userCancellationReason, userCancellationFeedback
        )
        VALUES (
          CURRENT_TIMESTAMP(),
          ?, ?,
          ?, 
          ?, ?,
          )`,
    [
      // none, default values
      surveyFeedbackCancelSubscription.userId, surveyFeedbackCancelSubscription.familyId,
      activeSubscriptionTransactionId,
      surveyFeedbackCancelSubscription.userCancellationReason, formatKnownString(surveyFeedbackCancelSubscription.userCancellationFeedback, 1000),
    ],
  );
}

async function createSurveyFeedbackForAppExperience(databaseConnection: Queryable, surveyFeedbackAppExperience: NotYetCreatedSurveyFeedbackAppExperienceRow): Promise<void> {
  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO surveyFeedbackAppExperience
      (
        surveyFeedbackDate,
        userId, familyId,
        appExperienceNumberOfStars, appExperienceFeedback
        )
        VALUES (
          CURRENT_TIMESTAMP(),
          ?, ?,
          ?, ?,
          )`,
    [
      // none, default values
      surveyFeedbackAppExperience.userId, surveyFeedbackAppExperience.familyId,
      surveyFeedbackAppExperience.appExperienceNumberOfStars, formatKnownString(surveyFeedbackAppExperience.appExperienceFeedback, 1000),
    ],
  );
}

export { createSurveyFeedbackForCancelSubscription, createSurveyFeedbackForAppExperience };
