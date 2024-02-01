import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetCreatedSurveyFeedbackCancelSubscriptionRow } from '../../main/types/SurveyFeedbackCancelSubscriptionRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';

/**
*  Queries the database to create a log. If the query is successful, then returns the logId.
*  If a problem is encountered, creates and throws custom error
*/
async function createSurveyFeedbackForCancelSubscription(databaseConnection: Queryable, surveyFeedback: NotYetCreatedSurveyFeedbackCancelSubscriptionRow): Promise<void> {
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
      surveyFeedback.userId, surveyFeedback.familyId,
      surveyFeedback.activeSubscriptionTransactionId,
      surveyFeedback.userCancellationReason, formatKnownString(surveyFeedback.userCancellationFeedback, 1000),
    ],
  );
}

export { createSurveyFeedbackForCancelSubscription };
