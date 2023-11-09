-- MariaDB dump 10.19-11.0.2-MariaDB, for osx10.18 (arm64)
--
-- Host: productionhound.czbmbrfbsczi.us-east-2.rds.amazonaws.com    Database: productionHound
-- ------------------------------------------------------
-- Server version	10.6.10-MariaDB-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appStoreServerNotifications`
--

DROP TABLE IF EXISTS `appStoreServerNotifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appStoreServerNotifications` (
  `notificationType` varchar(100) DEFAULT NULL COMMENT 'The in-app purchase event for which the App Store sent this version 2 notification.',
  `subtype` varchar(100) DEFAULT NULL COMMENT 'Additional information that identifies the notification event, or an empty string. The subtype applies only to select version 2 notifications.',
  `notificationUUID` char(36) NOT NULL COMMENT 'A unique identifier for the notification. Use this value to identify a duplicate notification.',
  `version` varchar(3) DEFAULT NULL COMMENT 'A string that indicates the App Store Server Notification version number.',
  `signedDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.',
  `dataAppAppleId` varchar(100) DEFAULT NULL COMMENT 'The unique identifier of the app that the notification applies to. This property is available for apps that are downloaded from the App Store; it isn’t present in the sandbox environment.',
  `dataBundleId` enum('com.example.Pupotty') DEFAULT NULL COMMENT 'The bundle identifier of the app.',
  `dataBundleVersion` smallint(5) unsigned DEFAULT NULL COMMENT 'The version of the build that identifies an iteration of the bundle.',
  `dataEnvironment` enum('Sandbox','Production') DEFAULT NULL COMMENT 'The server environment that the notification applies to, either sandbox or production.',
  `dataStatus` tinyint(3) unsigned DEFAULT NULL COMMENT 'The status of an auto-renewable subscription as of the signedDate in the responseBodyV2DecodedPayload. This field appears only for notifications sent for auto-renewable subscriptions.',
  `renewalInfoAutoRenewProductId` enum('com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly','com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly','com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly','com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly','com.jonathanxakellis.hound.sixfamilymembers.onemonth','com.jonathanxakellis.hound.sixfamilymembers.sixmonth','com.jonathanxakellis.hound.sixfamilymembers.oneyear') DEFAULT NULL COMMENT 'The product identifier of the product that renews at the next billing period.',
  `renewalInfoAutoRenewStatus` tinyint(3) unsigned DEFAULT NULL COMMENT 'The renewal status for an auto-renewable subscription.',
  `renewalInfoEnvironment` enum('Sandbox','Production') DEFAULT NULL COMMENT 'The server environment, either sandbox or production.',
  `renewalInfoExpirationIntent` tinyint(3) unsigned DEFAULT NULL COMMENT 'The reason a subscription expired.',
  `renewalInfoGracePeriodExpiresDate` datetime(3) DEFAULT NULL COMMENT 'The time when the billing grace period for subscription renewals expires.',
  `renewalInfoIsInBillingRetryPeriod` tinyint(1) DEFAULT NULL COMMENT 'The Boolean value that indicates whether the App Store is attempting to automatically renew an expired subscription.',
  `renewalInfoOfferIdentifier` varchar(100) DEFAULT NULL COMMENT 'The offer code or the promotional offer identifier.',
  `renewalInfoOfferType` tinyint(3) unsigned DEFAULT NULL COMMENT 'The type of subscription offer.',
  `renewalInfoOriginalTransactionId` bigint(20) unsigned DEFAULT NULL COMMENT 'The original transaction identifier of a purchase.',
  `renewalInfoPriceIncreaseStatus` tinyint(3) unsigned DEFAULT NULL COMMENT 'The status that indicates whether the auto-renewable subscription is subject to a price increase.',
  `renewalInfoProductId` enum('com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly','com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly','com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly','com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly','com.jonathanxakellis.hound.sixfamilymembers.onemonth','com.jonathanxakellis.hound.sixfamilymembers.sixmonth','com.jonathanxakellis.hound.sixfamilymembers.oneyear') DEFAULT NULL COMMENT 'The product identifier of the in-app purchase.',
  `renewalInfoRecentSubscriptionStartDate` datetime(3) DEFAULT NULL COMMENT 'The earliest start date of an auto-renewable subscription in a series of subscription purchases that ignores all lapses of paid service that are 60 days or less.',
  `renewalInfoRenewalDate` datetime(3) DEFAULT NULL COMMENT '// The UNIX time, in milliseconds, that the most recent auto-renewable subscription purchase expires.',
  `renewalInfoSignedDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.',
  `transactionInfoAppAccountToken` char(36) DEFAULT NULL COMMENT 'A UUID that associates the transaction with a user on your own service. If your app doesn’t provide an appAccountToken, this string is empty. For more information, see appAccountToken(_:).',
  `transactionInfoBundleId` enum('com.example.Pupotty') DEFAULT NULL COMMENT 'The bundle identifier of the app.',
  `transactionInfoEnvironment` enum('Sandbox','Production') DEFAULT NULL COMMENT 'The server environment, either sandbox or production.',
  `transactionInfoExpiresDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, the subscription expires or renews.',
  `transactionInfoInAppOwnershipType` enum('FAMILY_SHARED','PURCHASED') DEFAULT NULL COMMENT 'A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.',
  `transactionInfoIsUpgraded` tinyint(1) DEFAULT NULL COMMENT 'A Boolean value that indicates whether the user upgraded to another subscription.',
  `transactionInfoOfferIdentifier` varchar(100) DEFAULT NULL COMMENT 'The identifier that contains the promo code or the promotional offer identifier.',
  `transactionInfoOfferType` tinyint(3) unsigned DEFAULT NULL COMMENT 'A value that represents the promotional offer type.',
  `transactionInfoOriginalPurchaseDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, that represents the purchase date of the original transaction identifier.',
  `transactionInfoOriginalTransactionId` bigint(20) unsigned DEFAULT NULL COMMENT 'The transaction identifier of the original purchase.',
  `transactionInfoProductId` enum('com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly','com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly','com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly','com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly','com.jonathanxakellis.hound.sixfamilymembers.onemonth','com.jonathanxakellis.hound.sixfamilymembers.sixmonth','com.jonathanxakellis.hound.sixfamilymembers.oneyear') DEFAULT NULL COMMENT 'The product identifier of the in-app purchase.',
  `transactionInfoPurchaseDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.',
  `transactionInfoQuantity` tinyint(3) unsigned DEFAULT NULL COMMENT 'The number of consumable products the user purchased.',
  `transactionInfoRevocationDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, that the App Store refunded the transaction or revoked it from Family Sharing.',
  `transactionInfoRevocationReason` tinyint(3) unsigned DEFAULT NULL COMMENT 'The reason that the App Store refunded the transaction or revoked it from Family Sharing.',
  `transactionInfoSignedDate` datetime(3) DEFAULT NULL COMMENT 'The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature (JWS) data.',
  `transactionInfoSubscriptionGroupIdentifier` int(10) unsigned DEFAULT NULL COMMENT 'The identifier of the subscription group the subscription belongs to.',
  `transactionInfoTransactionId` bigint(20) unsigned DEFAULT NULL COMMENT 'The unique identifier of the transaction.',
  `transactionInfoType` enum('Auto-Renewable Subscription','Non-Consumable','Consumable','Non-Renewing Subscription') DEFAULT NULL COMMENT 'The type of the in-app purchase.',
  `transactionInfoWebOrderLineItemId` bigint(20) unsigned DEFAULT NULL COMMENT 'The unique identifier of subscription purchase events across devices, including subscription renewals.',
  PRIMARY KEY (`notificationUUID`),
  CONSTRAINT `CHECK_renewalInfoAutoRenewStatus` CHECK (`renewalInfoAutoRenewStatus` is null or `renewalInfoAutoRenewStatus` >= 0 and `renewalInfoAutoRenewStatus` <= 1),
  CONSTRAINT `CHECK_renewalInfoExpirationIntent` CHECK (`renewalInfoExpirationIntent` is null or `renewalInfoExpirationIntent` >= 1 and `renewalInfoExpirationIntent` <= 4),
  CONSTRAINT `CHECK_renewalInfoOfferType` CHECK (`renewalInfoOfferType` is null or `renewalInfoOfferType` >= 1 and `renewalInfoOfferType` <= 3),
  CONSTRAINT `CHECK_renewalInfoPriceIncreaseStatus` CHECK (`renewalInfoPriceIncreaseStatus` is null or `renewalInfoPriceIncreaseStatus` >= 0 and `renewalInfoPriceIncreaseStatus` <= 1),
  CONSTRAINT `CHECK_transactionInfoOfferType` CHECK (`transactionInfoOfferType` is null or `transactionInfoOfferType` >= 1 and `transactionInfoOfferType` <= 3),
  CONSTRAINT `CHECK_transactionInfoQuantity` CHECK (`transactionInfoQuantity` is null or `transactionInfoQuantity` >= 1),
  CONSTRAINT `CHECK_transactionInfoRevocationReason` CHECK (`transactionInfoQuantity` is null or `transactionInfoRevocationReason` >= 1 and `transactionInfoRevocationReason` <= 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dogLogs`
--

DROP TABLE IF EXISTS `dogLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dogLogs` (
  `logId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `dogId` bigint(20) unsigned NOT NULL,
  `userId` char(64) NOT NULL COMMENT 'Tracks the user who created the log',
  `logDate` datetime(3) NOT NULL,
  `logNote` varchar(500) NOT NULL,
  `logAction` enum('Custom','Feed','Fresh Water','Treat','Potty: Pee','Potty: Poo','Potty: Both','Potty: Didn''t Go','Accident','Walk','Brush','Bathe','Medicine','Weight','Wake Up','Sleep','Crate','Training Session','Doctor Visit') NOT NULL,
  `logCustomActionName` varchar(32) NOT NULL,
  `logUnit` enum('milligram','gram','ounce','pound','kilogram','milliliter','teaspoon','tablespoon','fluid ounce','cup','liter','kilometer','mile','minute','hour','pill','treat') DEFAULT NULL,
  `logNumberOfLogUnits` double DEFAULT NULL,
  `logLastModified` datetime(3) NOT NULL COMMENT 'Tracks when the log was last modified',
  `logIsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`logId`),
  KEY `INDEX_dogId` (`dogId`)
) ENGINE=InnoDB AUTO_INCREMENT=82995 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_INSERT_dogLogs_CHECK_dogIsDeleted
	BEFORE INSERT
	ON dogLogs FOR EACH ROW
BEGIN
	IF EXISTS (SELECT 1 FROM dogs WHERE dogId = NEW.dogId AND dogIsDeleted = 1) THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to insert log to dog marked as deleted';
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_UPDATE_dogLogs_CHECK_logIsDeleted
  BEFORE UPDATE 
  ON dogLogs
  FOR EACH ROW
BEGIN
  IF OLD.logIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update log marked as deleted';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `dogReminders`
--

DROP TABLE IF EXISTS `dogReminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dogReminders` (
  `reminderId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `dogId` bigint(20) unsigned NOT NULL,
  `reminderAction` enum('Custom','Feed','Fresh Water','Potty','Walk','Brush','Bathe','Medicine','Sleep','Training Session','Doctor Visit') NOT NULL,
  `reminderCustomActionName` varchar(32) NOT NULL,
  `reminderType` enum('countdown','weekly','monthly','oneTime') NOT NULL,
  `reminderIsEnabled` tinyint(1) NOT NULL,
  `reminderExecutionBasis` datetime(3) NOT NULL,
  `reminderExecutionDate` datetime(3) DEFAULT NULL,
  `reminderLastModified` datetime(3) NOT NULL,
  `reminderIsDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `snoozeExecutionInterval` mediumint(8) unsigned DEFAULT NULL,
  `countdownExecutionInterval` mediumint(8) unsigned NOT NULL,
  `weeklyUTCHour` tinyint(3) unsigned NOT NULL,
  `weeklyUTCMinute` tinyint(3) unsigned NOT NULL,
  `weeklySunday` tinyint(1) NOT NULL,
  `weeklyMonday` tinyint(1) NOT NULL,
  `weeklyTuesday` tinyint(1) NOT NULL,
  `weeklyWednesday` tinyint(1) NOT NULL,
  `weeklyThursday` tinyint(1) NOT NULL,
  `weeklyFriday` tinyint(1) NOT NULL,
  `weeklySaturday` tinyint(1) NOT NULL,
  `weeklySkippedDate` datetime(3) DEFAULT NULL,
  `monthlyUTCDay` tinyint(3) unsigned NOT NULL,
  `monthlyUTCHour` tinyint(3) unsigned NOT NULL,
  `monthlyUTCMinute` tinyint(3) unsigned NOT NULL,
  `monthlySkippedDate` datetime(3) DEFAULT NULL,
  `oneTimeDate` datetime(3) NOT NULL,
  PRIMARY KEY (`reminderId`),
  KEY `INDEX_dogId` (`dogId`),
  CONSTRAINT `CHECK_monthly` CHECK (`monthlyUTCHour` >= 0 and `monthlyUTCHour` <= 23 and `monthlyUTCMinute` >= 0 and `monthlyUTCMinute` <= 59 and `monthlyUTCDay` >= 0 and `monthlyUTCDay` <= 31),
  CONSTRAINT `CHECK_weekly` CHECK (`weeklyUTCHour` >= 0 and `weeklyUTCHour` <= 23 and `weeklyUTCMinute` >= 0 and `weeklyUTCMinute` <= 59 and (`weeklySunday` = 1 or `weeklyMonday` = 1 or `weeklyTuesday` = 1 or `weeklyWednesday` = 1 or `weeklyThursday` = 1 or `weeklyFriday` = 1 or `weeklySaturday` = 1))
) ENGINE=InnoDB AUTO_INCREMENT=7905 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_INSERT_dogReminders_CHECK_dogIsDeleted
	BEFORE INSERT
	ON dogReminders FOR EACH ROW
BEGIN
	IF EXISTS (SELECT 1 FROM dogs WHERE dogId = NEW.dogId AND dogIsDeleted = 1) THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to insert reminder to dog marked as deleted';
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted
  BEFORE UPDATE 
  ON dogReminders
  FOR EACH ROW
BEGIN
  IF OLD.reminderIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update reminder marked as deleted';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `dogs`
--

DROP TABLE IF EXISTS `dogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dogs` (
  `dogId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `familyId` char(64) NOT NULL,
  `dogName` varchar(32) NOT NULL,
  `dogLastModified` datetime(3) NOT NULL,
  `dogIsDeleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`dogId`),
  KEY `INDEX_familyId` (`familyId`)
) ENGINE=InnoDB AUTO_INCREMENT=1902 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_UPDATE_dogs_CHECK_dogIsDeleted
	BEFORE UPDATE 
	ON dogs FOR EACH ROW
BEGIN
  IF OLD.dogIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update dog marked as deleted';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `families`
--

DROP TABLE IF EXISTS `families`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `families` (
  `familyId` char(64) NOT NULL,
  `familyHeadUserId` char(64) NOT NULL COMMENT 'familyHead userId',
  `familyCode` char(8) NOT NULL,
  `familyIsLocked` tinyint(1) NOT NULL,
  `familyAccountCreationDate` datetime(3) NOT NULL,
  PRIMARY KEY (`familyId`),
  UNIQUE KEY `UN_familyCode` (`familyCode`,`familyHeadUserId`),
  CONSTRAINT `CHECK_familyCode` CHECK (`familyCode` regexp '^[[:upper:][:digit:]]{8}' = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `familyMembers`
--

DROP TABLE IF EXISTS `familyMembers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `familyMembers` (
  `familyId` char(64) NOT NULL,
  `userId` char(64) NOT NULL,
  `familyMemberJoinDate` datetime(3) NOT NULL,
  PRIMARY KEY (`userId`),
  KEY `INDEX_familyId` (`familyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `previousFamilies`
--

DROP TABLE IF EXISTS `previousFamilies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `previousFamilies` (
  `familyId` char(64) NOT NULL,
  `familyHeadUserId` char(64) NOT NULL,
  `familyCode` char(8) NOT NULL,
  `familyIsLocked` tinyint(1) NOT NULL,
  `familyAccountCreationDate` datetime(3) NOT NULL,
  `familyAccountDeletionDate` datetime(3) NOT NULL,
  KEY `INDEX_familyId` (`familyId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `previousFamilyMembers`
--

DROP TABLE IF EXISTS `previousFamilyMembers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `previousFamilyMembers` (
  `familyId` char(64) NOT NULL,
  `userId` char(64) NOT NULL,
  `familyMemberJoinDate` datetime(3) NOT NULL,
  `userFirstName` varchar(32) DEFAULT NULL,
  `userLastName` varchar(32) DEFAULT NULL,
  `familyMemberLeaveDate` datetime(3) NOT NULL,
  `familyMemberLeaveReason` enum('userLeft','userKicked','familyDeleted') NOT NULL,
  KEY `INDEX_userId` (`userId`),
  KEY `INDEX_familyId` (`familyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `previousRequests`
--

DROP TABLE IF EXISTS `previousRequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `previousRequests` (
  `requestId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `requestIP` varchar(32) DEFAULT NULL,
  `requestDate` datetime(3) NOT NULL,
  `requestMethod` enum('GET','PATCH','POST','PUT','DELETE') NOT NULL,
  `requestOriginalURL` varchar(500) NOT NULL,
  `requestBody` varchar(2000) DEFAULT NULL,
  `requestUserId` varchar(64) DEFAULT NULL,
  `requestFamilyId` varchar(64) DEFAULT NULL,
  `requestAppVersion` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`requestId`)
) ENGINE=InnoDB AUTO_INCREMENT=1159481 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `previousResponses`
--

DROP TABLE IF EXISTS `previousResponses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `previousResponses` (
  `responseId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `requestId` bigint(20) unsigned NOT NULL,
  `responseStatus` smallint(6) DEFAULT NULL,
  `responseDate` datetime(3) NOT NULL,
  `responseBody` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`responseId`),
  UNIQUE KEY `UN_previousResponses` (`requestId`)
) ENGINE=InnoDB AUTO_INCREMENT=1155374 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `previousServerErrors`
--

DROP TABLE IF EXISTS `previousServerErrors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `previousServerErrors` (
  `errorId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `errorDate` datetime(3) DEFAULT NULL,
  `errorSourceFunctions` varchar(500) DEFAULT NULL,
  `errorName` varchar(500) DEFAULT NULL,
  `errorMessage` varchar(500) DEFAULT NULL,
  `errorCode` varchar(500) DEFAULT NULL,
  `errorStack` varchar(2500) DEFAULT NULL,
  PRIMARY KEY (`errorId`)
) ENGINE=InnoDB AUTO_INCREMENT=1122 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `previousUsers`
--

DROP TABLE IF EXISTS `previousUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `previousUsers` (
  `userId` char(64) NOT NULL,
  `userIdentifier` varchar(64) NOT NULL,
  `userApplicationUsername` varchar(36) NOT NULL,
  `userEmail` varchar(254) DEFAULT NULL,
  `userFirstName` varchar(32) DEFAULT NULL,
  `userLastName` varchar(32) DEFAULT NULL,
  `userNotificationToken` varchar(256) DEFAULT NULL,
  `userAccountCreationDate` datetime(3) NOT NULL,
  `userAccountDeletionDate` datetime(3) NOT NULL,
  KEY `INDEX_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `userId` char(64) NOT NULL COMMENT 'The user that made this transaction',
  `numberOfFamilyMembers` tinyint(3) unsigned NOT NULL COMMENT 'The number of family members this transaction, if its a subscription, gives the family access to',
  `autoRenewProductId` enum('com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly','com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly','com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly','com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly','com.jonathanxakellis.hound.sixfamilymembers.onemonth','com.jonathanxakellis.hound.sixfamilymembers.sixmonth','com.jonathanxakellis.hound.sixfamilymembers.oneyear') NOT NULL COMMENT 'The product identifier of the product that renews at the next billing period.',
  `autoRenewStatus` tinyint(1) NOT NULL COMMENT 'The renewal status for an auto-renewable subscription.',
  `didUtilizeOfferIdentifier` tinyint(1) DEFAULT 0 COMMENT 'True if transaction had an offerIdentifier and a family member joined the family. False otherwise',
  `environment` enum('Sandbox','Production') NOT NULL COMMENT 'The server environment, either Sandbox or Production.',
  `expiresDate` datetime(3) NOT NULL COMMENT 'The UNIX time, in milliseconds, the subscription expires or renews.',
  `inAppOwnershipType` enum('FAMILY_SHARED','PURCHASED') NOT NULL COMMENT 'A string that describes whether the transaction was purchased by the user, or is available to them through Family Sharing.',
  `offerIdentifier` varchar(64) DEFAULT NULL COMMENT 'The reference name of a subscription offer that you configured in App Store Connect. This field is present when a customer redeems a subscription offer code. For more information about offer codes, see Set Up Offer Codes, and Implementing Offer Codes in Your App.',
  `offerType` tinyint(1) DEFAULT NULL COMMENT 'A value that represents the promotional offer type. The offer types 2 and 3 have an offerIdentifier.',
  `originalTransactionId` bigint(20) unsigned NOT NULL COMMENT 'The transaction identifier of the original purchase.',
  `productId` enum('com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly','com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly','com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly','com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly','com.jonathanxakellis.hound.sixfamilymembers.onemonth','com.jonathanxakellis.hound.sixfamilymembers.sixmonth','com.jonathanxakellis.hound.sixfamilymembers.oneyear') NOT NULL COMMENT 'The product identifier of the in-app purchase.',
  `purchaseDate` datetime(3) NOT NULL COMMENT 'The UNIX time, in milliseconds, that the App Store charged the user’s account for a purchase, restored product, subscription, or subscription renewal after a lapse.',
  `quantity` tinyint(3) unsigned NOT NULL COMMENT 'The number of consumable products the user purchased.',
  `revocationReason` tinyint(3) unsigned DEFAULT NULL COMMENT 'The revocation status for a transaction that has been refunded by the App Store or revoked from family sharing',
  `subscriptionGroupIdentifier` int(10) unsigned NOT NULL COMMENT 'The identifier of the subscription group the subscription belongs to.',
  `transactionId` bigint(20) unsigned NOT NULL COMMENT 'The unique identifier of the transaction.',
  `transactionReason` enum('PURCHASE','RENEWAL') DEFAULT NULL COMMENT 'The cause of a purchase transaction, which indicates whether it’s a customer’s purchase or a renewal for an auto-renewable subscription that the system initiates.',
  `webOrderLineItemId` bigint(20) unsigned NOT NULL COMMENT 'The unique identifier of subscription purchase events across devices, including subscription renewals.',
  PRIMARY KEY (`transactionId`),
  KEY `INDEX_userId` (`userId`),
  KEY `INDEX_expiresDate` (`expiresDate`),
  CONSTRAINT `CHECK_quantity` CHECK (`quantity` is null or `quantity` >= 1),
  CONSTRAINT `CHECK_numberOfFamilyMembers` CHECK (`numberOfFamilyMembers` is null or `numberOfFamilyMembers` >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userConfiguration`
--

DROP TABLE IF EXISTS `userConfiguration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userConfiguration` (
  `userId` char(64) NOT NULL,
  `userConfigurationIsNotificationEnabled` tinyint(1) NOT NULL,
  `userConfigurationIsLoudNotificationEnabled` tinyint(1) NOT NULL,
  `userConfigurationIsLogNotificationEnabled` tinyint(1) NOT NULL,
  `userConfigurationIsReminderNotificationEnabled` tinyint(1) NOT NULL,
  `userConfigurationMeasurementSystem` tinyint(3) unsigned NOT NULL,
  `userConfigurationInterfaceStyle` tinyint(3) unsigned NOT NULL,
  `userConfigurationSnoozeLength` mediumint(8) unsigned NOT NULL,
  `userConfigurationNotificationSound` enum('Radar','Circuit','Illuminate','Presto','Sencha','Signal','Silk','Stargaze','Twinkle','Waves') NOT NULL,
  `userConfigurationLogsInterfaceScale` enum('Small','Medium','Large') NOT NULL,
  `userConfigurationRemindersInterfaceScale` enum('Small','Medium','Large') NOT NULL,
  `userConfigurationIsSilentModeEnabled` tinyint(1) NOT NULL,
  `userConfigurationSilentModeStartUTCHour` tinyint(3) unsigned NOT NULL,
  `userConfigurationSilentModeEndUTCHour` tinyint(3) unsigned NOT NULL,
  `userConfigurationSilentModeStartUTCMinute` tinyint(3) unsigned NOT NULL,
  `userConfigurationSilentModeEndUTCMinute` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `CHECK_interfaceStyle` CHECK (`userConfigurationInterfaceStyle` <= 2),
  CONSTRAINT `CHECK_silentModeUTCHour` CHECK (`userConfigurationSilentModeStartUTCHour` >= 0 and `userConfigurationSilentModeStartUTCHour` <= 23 and `userConfigurationSilentModeEndUTCHour` >= 0 and `userConfigurationSilentModeStartUTCHour` <= 23),
  CONSTRAINT `CHECK_silentModeUTCMinute` CHECK (`userConfigurationSilentModeStartUTCMinute` >= 0 and `userConfigurationSilentModeStartUTCMinute` <= 59 and `userConfigurationSilentModeEndUTCMinute` >= 0 and `userConfigurationSilentModeStartUTCMinute` <= 59)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `userId` char(64) NOT NULL,
  `userIdentifier` varchar(64) NOT NULL,
  `userAppAccountToken` varchar(36) NOT NULL,
  `userEmail` varchar(254) DEFAULT NULL,
  `userFirstName` varchar(32) DEFAULT NULL,
  `userLastName` varchar(32) DEFAULT NULL,
  `userNotificationToken` varchar(256) DEFAULT NULL,
  `userAccountCreationDate` datetime(3) NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `UN_userIdentifier` (`userIdentifier`),
  UNIQUE KEY `UN_userApplicationUsername` (`userAppAccountToken`),
  CONSTRAINT `CHECK_userEmail` CHECK (`userEmail` <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_INSERT_users_CHECK_userEmail
BEFORE INSERT
ON users FOR EACH ROW
BEGIN
	IF NEW.userEmail IS NOT NULL 
	AND EXISTS (SELECT 1 FROM users WHERE userEmail = NEW.userEmail) THEN 
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to insert user with a non-null, non-unique userEmail';
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER BEFORE_UPDATE_users_CHECK_userEmail
BEFORE UPDATE
ON users FOR EACH ROW
BEGIN
	IF NEW.userEmail IS NOT NULL 
	AND NEW.userEmail != OLD.userEmail
	AND EXISTS (SELECT 1 FROM users WHERE userEmail = NEW.userEmail) THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update user to a non-null, non-unique userEmail';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping routines for database 'productionHound'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-11-08 21:54:52
