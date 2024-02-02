CREATE TABLE developmentHound.feedbackCancelSubscription (
	feedbackId bigint(20) unsigned auto_increment NOT NULL,
	userId char(64) NOT NULL,
	familyId char(64) NOT NULL,
	activeSubscriptionTransactionId bigint(20) unsigned NULL,
	userCancellationReason enum('tooExpensive','lackingKeyFeatures','foundBetterAlternative','puppyOutgrewApp','notUseful','tooManyBugs','updateMadeThingsWorse','somethingElse') NULL,
	userCancellationFeedback varchar(1000) NULL,
	CONSTRAINT feedbackCancelSubscription_PK PRIMARY KEY (feedbackId)
)
ENGINE=InnoDB
DEFAULT CHARSET=latin1
COLLATE=latin1_swedish_ci;

ALTER TABLE developmentHound.feedbackCancelSubscription MODIFY COLUMN userCancellationFeedback varchar(1000) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL;
ALTER TABLE developmentHound.feedbackCancelSubscription ADD feedbackDate DATETIME(3) NOT NULL;
ALTER TABLE developmentHound.feedbackCancelSubscription CHANGE feedbackDate feedbackDate DATETIME(3) NOT NULL AFTER feedbackId;

RENAME TABLE developmentHound.feedbackCancelSubscription TO developmentHound.surveyFeedbackCancelSubscription;
ALTER TABLE developmentHound.surveyFeedbackCancelSubscription CHANGE feedbackId surveyFeedbackId bigint(20) unsigned auto_increment NOT NULL;
ALTER TABLE developmentHound.surveyFeedbackCancelSubscription CHANGE feedbackDate surveyFeedbackDate datetime(3) NOT NULL;
