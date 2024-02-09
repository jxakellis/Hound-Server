import { type Queryable, type ResultSetHeader, databaseQuery } from '../../main/database/databaseQuery.js';
import { type NotYetCreatedSurveyFeedbackRow } from '../../main/types/SurveyFeedbackRow.js';
import { type NotYetCreatedSurveyFeedbackCancelSubscriptionRow, type SurveyFeedbackCancelSubscriptionRow } from '../../main/types/SurveyFeedbackCancelSubscriptionRow.js';
import { type NotYetCreatedSurveyFeedbackAppExperienceRow, type SurveyFeedbackAppExperienceRow } from '../../main/types/SurveyFeedbackAppExperienceRow.js';
import { formatKnownString } from '../../main/format/formatObject.js';
import { SurveyFeedbackType } from '../../main/enums/SurveyFeedbackType.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

async function createSurveyFeedbackForCancelSubscription(databaseConnection: Queryable, surveyFeedbackCancelSubscription: SurveyFeedbackCancelSubscriptionRow): Promise<void> {
  // If there is a placeholder transactionId of -1, then leave the value as null so that we don't try to insert this value
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
        surveyFeedbackId,
        activeSubscriptionTransactionId,
        surveyFeedbackUserCancellationReason, surveyFeedbackUserCancellationFeedback
        )
        VALUES (
          ?, 
          ?,
          ?, ?,
          )`,
    [
      // none, default values
      surveyFeedbackCancelSubscription.surveyFeedbackId,
      activeSubscriptionTransactionId,
      surveyFeedbackCancelSubscription.surveyFeedbackUserCancellationReason, formatKnownString(surveyFeedbackCancelSubscription.surveyFeedbackUserCancellationFeedback, 1000),
    ],
  );
}

async function createSurveyFeedbackForAppExperience(databaseConnection: Queryable, surveyFeedbackAppExperience: SurveyFeedbackAppExperienceRow): Promise<void> {
  await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO surveyFeedbackAppExperience
      (
        surveyFeedbackId,
        surveyFeedbackAppExperienceNumberOfStars, surveyFeedbackAppExperienceFeedback
        )
        VALUES (
          ?,
          ?, ?,
          )`,
    [
      // none, default values
      surveyFeedbackAppExperience.surveyFeedbackId,
      surveyFeedbackAppExperience.surveyFeedbackAppExperienceNumberOfStars, formatKnownString(surveyFeedbackAppExperience.surveyFeedbackAppExperienceFeedback, 1000),
    ],
  );
}

/**
 * For the main surveyFeedback database, inserts the universal surveyFeedback information.
 * Depending upon the surveyFeedbackType, inserts the specific surveyFeedback into their respective database
 */
async function createSurveyFeedbackForSurveyFeedback(
  databaseConnection: Queryable,
  surveyFeedback: NotYetCreatedSurveyFeedbackRow & Partial<NotYetCreatedSurveyFeedbackCancelSubscriptionRow & NotYetCreatedSurveyFeedbackAppExperienceRow>,
): Promise<void> {
  // Insert a record into the main surveyFeedback database with all of the metrics
  const result = await databaseQuery<ResultSetHeader>(
    databaseConnection,
    `INSERT INTO surveyFeedback
    (userId, familyId,
      surveyFeedbackDate, surveyFeedbackType,
      surveyFeedbackDeviceMetricModel, surveyFeedbackDeviceMetricSystemVersion,
      surveyFeedbackDeviceMetricAppVersion, surveyFeedbackDeviceMetricLocale)
      VALUES (
        ?, ?,
        CURRENT_TIMESTAMP(), ?,
        ?, ?,
        ?, ?
      )`,
    [
      surveyFeedback.userId, surveyFeedback.familyId,
      surveyFeedback.surveyFeedbackType,
      formatKnownString(surveyFeedback.surveyFeedbackDeviceMetricModel, 100), formatKnownString(surveyFeedback.surveyFeedbackDeviceMetricSystemVersion, 10),
      formatKnownString(surveyFeedback.surveyFeedbackDeviceMetricAppVersion, 10), formatKnownString(surveyFeedback.surveyFeedbackDeviceMetricLocale, 100),
    ],
  );

  // Once the master survey feedback record is inserted, then we can insert the more specific details into the respective databases
  if (surveyFeedback.surveyFeedbackType === SurveyFeedbackType.cancelSubscription) {
    // activeSubscriptionTransactionId can be missing
    // surveyFeedbackUserCancellationReason can be missing
    if (surveyFeedback.surveyFeedbackUserCancellationFeedback === undefined || surveyFeedback.surveyFeedbackUserCancellationFeedback === null) {
      throw new HoundError('surveyFeedbackUserCancellationFeedback missing', createSurveyFeedbackForSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }

    await createSurveyFeedbackForCancelSubscription(
      databaseConnection,
      {
        surveyFeedbackId: result.insertId,
        activeSubscriptionTransactionId: surveyFeedback.activeSubscriptionTransactionId,
        surveyFeedbackUserCancellationReason: surveyFeedback.surveyFeedbackUserCancellationReason,
        surveyFeedbackUserCancellationFeedback: surveyFeedback.surveyFeedbackUserCancellationFeedback,
      },
    );

    return;
  }
  if (surveyFeedback.surveyFeedbackType === SurveyFeedbackType.appExperience) {
    if (surveyFeedback.surveyFeedbackAppExperienceNumberOfStars === undefined || surveyFeedback.surveyFeedbackAppExperienceNumberOfStars === null) {
      throw new HoundError('surveyFeedbackAppExperienceNumberOfStars missing', createSurveyFeedbackForSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }
    if (surveyFeedback.surveyFeedbackAppExperienceFeedback === undefined || surveyFeedback.surveyFeedbackAppExperienceFeedback === null) {
      throw new HoundError('surveyFeedbackAppExperienceFeedback missing', createSurveyFeedbackForSurveyFeedback, ERROR_CODES.VALUE.MISSING);
    }

    await createSurveyFeedbackForAppExperience(
      databaseConnection,
      {
        surveyFeedbackId: result.insertId,
        surveyFeedbackAppExperienceNumberOfStars: surveyFeedback.surveyFeedbackAppExperienceNumberOfStars,
        surveyFeedbackAppExperienceFeedback: surveyFeedback.surveyFeedbackAppExperienceFeedback,
      },
    );
    return;
  }

  // surveyFeedbackType did not match any of the known types. Throw an error
  throw new HoundError(`surveyFeedbackType of '${surveyFeedback.surveyFeedbackType}' invalid`, createSurveyFeedbackForSurveyFeedback, ERROR_CODES.VALUE.INVALID);
}

export { createSurveyFeedbackForSurveyFeedback };
