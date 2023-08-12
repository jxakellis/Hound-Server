ALTER TABLE developmentHound.previousFamilyMembers MODIFY COLUMN userFirstName varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL;
ALTER TABLE developmentHound.previousFamilyMembers MODIFY COLUMN userLastName varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL;

ALTER TABLE developmentHound.appStoreServerNotifications ADD dataStatus tinyint(3) unsigned NULL COMMENT 'The status of an auto-renewable subscription as of the signedDate in the responseBodyV2DecodedPayload. This field appears only for notifications sent for auto-renewable subscriptions.';
ALTER TABLE developmentHound.appStoreServerNotifications CHANGE dataStatus dataStatus tinyint(3) unsigned DEFAULT NULL NULL COMMENT 'The status of an auto-renewable subscription as of the signedDate in the responseBodyV2DecodedPayload. This field appears only for notifications sent for auto-renewable subscriptions.' AFTER dataEnvironment;

ALTER TABLE developmentHound.transactions ADD isIntroductoryOffer BOOL NULL COMMENT 'An indicator of whether an auto-renewable subscription is in the introductory price period.';
ALTER TABLE developmentHound.transactions CHANGE isIntroductoryOffer isIntroductoryOffer BOOL NULL COMMENT 'An indicator of whether an auto-renewable subscription is in the introductory price period.' AFTER autoRenewProductId;
ALTER TABLE developmentHound.transactions CHANGE isIntroductoryOffer isInIntroductoryPeriod tinyint(1) DEFAULT NULL NULL COMMENT 'An indicator of whether an auto-renewable subscription is in the introductory price period.';

UPDATE developmentHound.transactions t
JOIN developmentHound.appStoreServerNotifications assn ON t.transactionId = assn.transactionInfoTransactionId
SET t.isInIntroductoryPeriod = (assn.transactionInfoOfferType = 1);

ALTER TABLE developmentHound.transactions MODIFY COLUMN isInIntroductoryPeriod tinyint(1) NOT NULL COMMENT 'An indicator of whether an auto-renewable subscription is in the introductory price period.';


