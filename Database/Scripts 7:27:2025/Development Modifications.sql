ALTER TABLE developmentHound.previousServerErrors ADD errorDebugInfo varchar(2500) NULL;

# LOG ACTION TYPES

CREATE TABLE developmentHound.logActionTypes (
  `logActionTypeId`    BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `internalValue`  VARCHAR(32)         NOT NULL,
  `readableValue`  VARCHAR(32)         NOT NULL,
  `emoji`          VARCHAR(32)         NOT NULL,
  `sortOrder`      TINYINT(3) UNSIGNED NOT NULL,
  PRIMARY KEY (`logActionTypeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE developmentHound.logActionTypes
	ADD CONSTRAINT `logActionTypes_UN_sortOrder`
    UNIQUE (`sortOrder`);

ALTER TABLE developmentHound.logActionTypes
	ADD CONSTRAINT `logActionTypes_UN_internalValue`
    UNIQUE (`internalValue`);

INSERT INTO developmentHound.logActionTypes (`internalValue`, `readableValue`, `emoji`, `sortOrder`) VALUES
  ('feed',             'Feed',             '🍗',  5),
  ('water',            'Fresh Water',      '🚰',  10),
  ('treat',            'Treat',            '🦴',  15),
  ('pee',              'Pee',              '💦',  20),
  ('poo',              'Poo',              '💩',  25),
  ('both',             'Pee & Poo',        '🧻',  30),
  ('neither',          'Didn\'t Go Potty', '🚫',  35),
  ('accident',         'Accident',         '🚨',  40),
  ('walk',             'Walk',             '🦮',  45),
  ('brush',            'Brush',            '💈', 50),
  ('bathe',            'Bathe',            '🛁', 55),
  ('medicine',         'Medicine',         '💊', 60),
  ('vaccine',          'Vaccine',          '💉', 65),
  ('weight',           'Weight',           '⚖️', 70),
  ('wakeUp',           'Wake Up',          '☀️', 75),
  ('sleep',            'Sleep',            '💤', 80),
  ('crate',            'Crate',            '🏡', 85),
  ('trainingSession',  'Training Session', '🎓', 90),
  ('doctor',           'Doctor Visit',     '🩺', 95),
  ('custom',           'Custom',           '📝', 100);
 
 INSERT INTO developmentHound.logActionTypes (`internalValue`, `readableValue`, `emoji`, `sortOrder`) VALUES
  ('didNotEat',             'Didn\'t Eat',             '🍽️',  7);

ALTER TABLE developmentHound.dogLogs  ADD COLUMN `logActionTypeId` bigint(20) UNSIGNED NULL AFTER `logAction`;

DROP TRIGGER IF EXISTS BEFORE_UPDATE_dogLogs_CHECK_logIsDeleted;

UPDATE developmentHound.dogLogs AS dl
	JOIN developmentHound.logActionTypes AS lat
    ON dl.logAction = lat.internalValue
	SET dl.logActionTypeId = lat.logActionTypeId;

ALTER TABLE developmentHound.dogLogs RENAME COLUMN logAction to DEPRECIATED_logAction;
ALTER TABLE developmentHound.dogLogs MODIFY COLUMN DEPRECIATED_logAction varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;

CREATE TRIGGER BEFORE_UPDATE_dogLogs_CHECK_logIsDeleted
BEFORE UPDATE ON dogLogs
FOR EACH ROW
BEGIN
  IF OLD.logIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update log marked as deleted';
  END IF;
END;

ALTER TABLE developmentHound.dogLogs
  ADD CONSTRAINT `dogLogs_FK_logActionTypes`
    FOREIGN KEY (`logActionTypeId`)
    REFERENCES `logActionTypes` (`logActionTypeId`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE developmentHound.logActionTypes  ADD COLUMN `isDefault` tinyint(1) NOT NULL DEFAULT 0 AFTER `sortOrder`;
UPDATE developmentHound.logActionTypes lat SET lat.isDefault = 1 WHERE lat.internalValue = 'feed';

DROP TRIGGER IF EXISTS BEFORE_INSERT_lat_CHECK_isDefault;
CREATE TRIGGER BEFORE_INSERT_lat_CHECK_isDefault
BEFORE INSERT ON logActionTypes
FOR EACH ROW
BEGIN
  IF NEW.isDefault = 1
  THEN
    IF (SELECT COUNT(*) FROM logActionTypes WHERE isDefault = 1) > 0
    THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one default row allowed';
    END IF;
  END IF;
END;

DROP TRIGGER IF EXISTS BEFORE_UPDATE_lat_CHECK_isDefault;
CREATE TRIGGER BEFORE_UPDATE_lat_CHECK_isDefault
BEFORE UPDATE ON logActionTypes
FOR EACH ROW
BEGIN
  IF OLD.isDefault = 0 AND NEW.isDefault = 1
  THEN
    IF (SELECT COUNT(*) FROM logActionTypes WHERE isDefault = 1 AND logActionTypeId != OLD.logActionTypeId) > 0
    THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one default row allowed';
    END IF;
  END IF;
END;
   
# DOG TRIGGERS

CREATE TABLE developmentHound.dogTriggers (
  triggerId                   BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  triggerUUID                 CHAR(36)             NOT NULL,
  dogUUID                     CHAR(36)             NOT NULL,
  triggerCustomName           VARCHAR(32)          NOT NULL,
  triggerType                 ENUM('timeDelay','fixedTime')     NOT NULL,
  triggerTimeDelay            DOUBLE               NOT NULL,
  triggerFixedTimeType        ENUM('day','week','month')        NOT NULL,
  triggerFixedTimeTypeAmount  TINYINT(3) UNSIGNED  NOT NULL,
  triggerFixedTimeUTCHour     TINYINT(3) UNSIGNED  NOT NULL,
  triggerFixedTimeUTCMinute   TINYINT(3) UNSIGNED  NOT NULL,
  triggerLastModified         DATETIME(3)          NOT NULL,
  triggerIsDeleted            TINYINT(1)           NOT NULL DEFAULT 0,
  PRIMARY KEY (triggerId),
  UNIQUE KEY dogTriggers_UN_triggerUUID_dogUUID (triggerUUID, dogUUID),
  CONSTRAINT CHECK_timeDelay  CHECK (triggerTimeDelay > 0),
  CONSTRAINT CHECK_fixedTime  CHECK (
    triggerFixedTimeUTCHour >= 0
    AND triggerFixedTimeUTCHour <= 23
    AND triggerFixedTimeUTCMinute >= 0
    AND triggerFixedTimeUTCMinute <= 59
    AND triggerFixedTimeTypeAmount >= 0
  )
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;
 
CREATE TABLE developmentHound.dogTriggersLogActionReactions (
  reactionId        BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  triggerUUID         CHAR(36) NOT NULL,
  logActionTypeId   BIGINT(20) UNSIGNED NOT NULL,
  PRIMARY KEY (reactionId),
  CONSTRAINT dogTriggersLogActionReactions_FK_dogTriggers
    FOREIGN KEY (triggerUUID)
    REFERENCES developmentHound.dogTriggers (triggerUUID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT dogTriggersLogActionReactions_FK_logActionTypes
    FOREIGN KEY (logActionTypeId)
    REFERENCES developmentHound.logActionTypes (logActionTypeId)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
 
ALTER TABLE developmentHound.dogTriggersLogActionReactions
  ADD CONSTRAINT dogTriggersLogActionReactions_UN_triggerUUID_logActionTypeId
  UNIQUE (triggerUUID, logActionTypeId);
 
ALTER TABLE developmentHound.dogLogs
  ADD CONSTRAINT dogLogs_FK_dogs
    FOREIGN KEY (dogUUID)
    REFERENCES developmentHound.dogs (dogUUID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogReminders
  ADD CONSTRAINT dogReminders_FK_dogs
    FOREIGN KEY (dogUUID)
    REFERENCES developmentHound.dogs (dogUUID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogTriggers
  ADD CONSTRAINT dogTriggers_FK_dogs
    FOREIGN KEY (dogUUID)
    REFERENCES developmentHound.dogs (dogUUID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

CREATE TABLE developmentHound.dogTriggersLogCustomActionNameReactions (
  reactionId        BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  triggerUUID         CHAR(36) NOT NULL,
  logCustomActionName   VARCHAR(32) NOT NULL,
  PRIMARY KEY (reactionId),
  CONSTRAINT dogTriggersLogCustomActionNameReactions_FK_dogTriggers
    FOREIGN KEY (triggerUUID)
    REFERENCES developmentHound.dogTriggers (triggerUUID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
 
 ALTER TABLE developmentHound.dogTriggersLogCustomActionNameReactions
  ADD CONSTRAINT dtlcanr_UN_triggerUUID_logCustomActionName
  UNIQUE (triggerUUID, logCustomActionName);
 
 # REMINDER ACTION TYPES
 
 CREATE TABLE developmentHound.reminderActionTypes (
  `reminderActionTypeId`    BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `internalValue`  VARCHAR(32)         NOT NULL,
  `readableValue`  VARCHAR(32)         NOT NULL,
  `emoji`          VARCHAR(32)         NOT NULL,
  `sortOrder`      TINYINT(3) UNSIGNED NOT NULL,
  `isDefault` 		TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`reminderActionTypeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE developmentHound.reminderActionTypes
	ADD CONSTRAINT `rat_UN_sortOrder`
    UNIQUE (`sortOrder`);

ALTER TABLE developmentHound.reminderActionTypes
	ADD CONSTRAINT `rat_UN_internalValue`
    UNIQUE (`internalValue`);
 
INSERT INTO developmentHound.reminderActionTypes (internalValue, readableValue, emoji, sortOrder, isDefault) VALUES
  ('feed', 'Feed', '🍗',  5, 1),
  ('water', 'Fresh Water', '🚰',  10, 0),
  ('potty', 'Potty', '🚽',  15, 0),
  ('walk', 'Walk', '🦮',  20, 0),
  ('brush', 'Brush', '💈',  25, 0),
  ('bathe', 'Bathe', '🛁',  28, 0),
  ('medicine', 'Medicine', '💊',  30, 0),
  ('sleep', 'Sleep', '💤',  35, 0),
  ('trainingSession', 'Training Session', '🎓',  40, 0),
  ('doctor', 'Doctor Visit', '🩺',  45, 0),
  ('custom', 'Custom', '📝',  50, 0);

ALTER TABLE developmentHound.dogReminders  ADD COLUMN reminderActionTypeId bigint(20) UNSIGNED NULL AFTER reminderAction;

DROP TRIGGER IF EXISTS BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted;

UPDATE developmentHound.dogReminders AS dr
	JOIN developmentHound.reminderActionTypes AS rat
    ON dr.reminderAction = rat.internalValue
	SET dr.reminderActionTypeId = rat.reminderActionTypeId;

ALTER TABLE developmentHound.dogReminders RENAME COLUMN reminderAction to DEPRECIATED_reminderAction;
ALTER TABLE developmentHound.dogReminders MODIFY COLUMN DEPRECIATED_reminderAction varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;


CREATE TRIGGER BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted
BEFORE UPDATE ON dogReminders
FOR EACH ROW
BEGIN
  IF OLD.reminderIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update reminder marked as deleted';
  END IF;
END;

ALTER TABLE developmentHound.dogReminders
  ADD CONSTRAINT `dr_FK_reminderActionTypes`
    FOREIGN KEY (`reminderActionTypeId`)
    REFERENCES `reminderActionTypes` (`reminderActionTypeId`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

DROP TRIGGER IF EXISTS BEFORE_INSERT_rat_CHECK_isDefault;
CREATE TRIGGER BEFORE_INSERT_rat_CHECK_isDefault
BEFORE INSERT ON reminderActionTypes
FOR EACH ROW
BEGIN
  IF NEW.isDefault = 1
  THEN
    IF (SELECT COUNT(*) FROM reminderActionTypes WHERE isDefault = 1) > 0
    THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one default row allowed';
    END IF;
  END IF;
END;

DROP TRIGGER IF EXISTS BEFORE_UPDATE_rat_CHECK_isDefault;
CREATE TRIGGER BEFORE_UPDATE_rat_CHECK_isDefault
BEFORE UPDATE ON reminderActionTypes
FOR EACH ROW
BEGIN
  IF OLD.isDefault = 0 AND NEW.isDefault = 1
  THEN
    IF (SELECT COUNT(*) FROM reminderActionTypes WHERE isDefault = 1 AND reminderActionTypeId != OLD.reminderActionTypeId) > 0
    THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one default row allowed';
    END IF;
  END IF;
END;

# REMINDER AND LOG ACTION TYPE MAPPINGS

CREATE TABLE developmentHound.mappingLogActionTypesReminderActionTypes (
  mappingId             BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  logActionTypeId       BIGINT(20) UNSIGNED NOT NULL,
  reminderActionTypeId  BIGINT(20) UNSIGNED NOT NULL,
  PRIMARY KEY (mappingId),
  UNIQUE KEY mlatrat_UN_logActionTypeId_reminderActionTypeId (logActionTypeId, reminderActionTypeId),
  CONSTRAINT mlatrat_FK_logActionTypes
    FOREIGN KEY (logActionTypeId)
    REFERENCES developmentHound.logActionTypes (logActionTypeId)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT mlatrat_FK_reminderActionTypes
    FOREIGN KEY (reminderActionTypeId)
    REFERENCES developmentHound.reminderActionTypes (reminderActionTypeId)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;
 
 INSERT INTO developmentHound.mappingLogActionTypesReminderActionTypes
  (logActionTypeId, reminderActionTypeId)
SELECT lat.logActionTypeId, rat.reminderActionTypeId
  FROM developmentHound.logActionTypes   AS lat
  JOIN developmentHound.reminderActionTypes AS rat
    ON lat.internalValue = rat.internalValue
 WHERE lat.internalValue IN ('feed', 'water')
UNION ALL
SELECT lat.logActionTypeId, rat.reminderActionTypeId
  FROM developmentHound.logActionTypes   AS lat
  JOIN developmentHound.reminderActionTypes AS rat
    ON rat.internalValue = 'potty'
 WHERE lat.internalValue IN ('pee', 'poo', 'both', 'neither', 'accident')
UNION ALL
SELECT lat.logActionTypeId, rat.reminderActionTypeId
  FROM developmentHound.logActionTypes   AS lat
  JOIN developmentHound.reminderActionTypes AS rat
    ON lat.internalValue = rat.internalValue
 WHERE lat.internalValue IN (
   'walk', 'brush', 'bathe', 'medicine', 'sleep', 
   'trainingSession', 'doctor', 'custom'
 );

INSERT INTO developmentHound.mappingLogActionTypesReminderActionTypes
  (logActionTypeId, reminderActionTypeId)
SELECT lat.logActionTypeId, rat.reminderActionTypeId
  FROM developmentHound.logActionTypes   AS lat
  JOIN developmentHound.reminderActionTypes AS rat
    ON rat.internalValue = 'feed'
 WHERE lat.internalValue IN ('didNotEat');

RENAME TABLE logActionTypes TO logActionType;
RENAME TABLE reminderActionTypes TO reminderActionType;
RENAME TABLE mappingLogActionTypesReminderActionTypes TO mappingLogActionTypeReminderActionType;
RENAME TABLE dogTriggersLogActionReactions TO dogTriggerLogActionReaction;
RENAME TABLE dogTriggersLogCustomActionNameReactions TO dogTriggerLogCustomActionNameReaction;

 ALTER TABLE developmentHound.dogTriggers  ADD COLUMN resultReminderActionTypeId bigint(20) UNSIGNED NULL AFTER triggerCustomName;
ALTER TABLE developmentHound.dogTriggers
  ADD CONSTRAINT `dt_FK_reminderActionType`
    FOREIGN KEY (`resultReminderActionTypeId`)
    REFERENCES `reminderActionType` (`reminderActionTypeId`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
   
 # ADDING allowsCustom to both type tables
   
ALTER TABLE developmentHound.logActionType
  ADD COLUMN allowsCustom TINYINT(1) NOT NULL DEFAULT 0 AFTER isDefault;

UPDATE developmentHound.logActionType
SET allowsCustom = 1
WHERE internalValue IN ('medicine','vaccine','custom','trainingSession','doctor');

ALTER TABLE developmentHound.reminderActionType
  ADD COLUMN allowsCustom TINYINT(1) NOT NULL DEFAULT 0 AFTER isDefault;

UPDATE developmentHound.reminderActionType
SET allowsCustom = 1
WHERE internalValue IN ('medicine','custom','trainingSession','doctor');

# LOG UNITS

CREATE TABLE developmentHound.logUnitType (
  logUnitTypeId    BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  unitSymbol       VARCHAR(100)           NOT NULL,
  readableValue    VARCHAR(100)           NOT NULL,
  isImperial       TINYINT(1)             NOT NULL,
  isMetric         TINYINT(1)             NOT NULL,
  isUnitMass       TINYINT(1)             NOT NULL,
  isUnitVolume     TINYINT(1)             NOT NULL,
  isUnitLength     TINYINT(1)             NOT NULL,
  PRIMARY KEY (logUnitTypeId),
  UNIQUE KEY lut_UN_readableValue (readableValue),
  UNIQUE KEY lut_UN_unitSymbol (unitSymbol),
  CONSTRAINT lut_CHECK_oneDimensionOnly CHECK ((isUnitMass + isUnitVolume + isUnitLength) <= 1)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
 
 ALTER TABLE developmentHound.logUnitType ADD CONSTRAINT lut_CHECK_atLeastOneMeasurementSystem CHECK ((isImperial + isMetric) >= 1);

ALTER TABLE developmentHound.logUnitType ADD COLUMN sortOrder TINYINT(3) UNSIGNED NOT NULL;
ALTER TABLE developmentHound.logUnitType ADD UNIQUE KEY lut_UN_sortOrder (sortOrder);

INSERT INTO developmentHound.logUnitType
  (unitSymbol, sortOrder, readableValue, isImperial, isMetric, isUnitMass, isUnitVolume, isUnitLength)
VALUES
  ('mg',      1, 'milligram',     0, 1, 1, 0, 0),
  ('g',       2, 'gram',          0, 1, 1, 0, 0),
  ('oz',      3, 'ounce',         1, 0, 1, 0, 0),
  ('lb',      4, 'pound',         1, 0, 1, 0, 0),
  ('kg',      5, 'kilogram',      0, 1, 1, 0, 0),
  ('mL',      6, 'milliliter',    0, 1, 0, 1, 0),
  ('tsp',     7, 'teaspoon',      1, 0, 0, 1, 0),
  ('tbsp',    8, 'tablespoon',    1, 0, 0, 1, 0),
  ('fl oz',   9,  'fluid ounce',   1, 0, 0, 1, 0),
  ('cup',     10, 'cup',           1, 0, 0, 1, 0),
  ('L',       11, 'liter',         0, 1, 0, 1, 0),
  ('km',      12, 'kilometer',     0, 1, 0, 0, 1),
  ('mi',      13, 'mile',          1, 0, 0, 0, 1),
  ('pill',    14, 'pill',          1, 1, 0, 0, 0),
  ('treat',   15, 'treat',         1, 1, 0, 0, 0),
  ('calorie', 16, 'calorie',       1, 1, 0, 0, 0);
 
 CREATE TABLE developmentHound.mappingLogActionTypesLogUnitType (
  mappingId             BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  logActionTypeId       BIGINT(20) UNSIGNED NOT NULL,
  logUnitTypeId  BIGINT(20) UNSIGNED NOT NULL,
  PRIMARY KEY (mappingId),
  UNIQUE KEY mlatlut_UN_logActionTypeId_logUnitTypeId (logActionTypeId, logUnitTypeId),
  CONSTRAINT mlatlut_FK_logActionType
    FOREIGN KEY (logActionTypeId)
    REFERENCES developmentHound.logActionType (logActionTypeId)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  CONSTRAINT mlatlut_FK_logUnitType
    FOREIGN KEY (logUnitTypeId)
    REFERENCES developmentHound.logUnitType (logUnitTypeId)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;
 
 INSERT INTO developmentHound.mappingLogActionTypesLogUnitType
  (logActionTypeId, logUnitTypeId)
VALUES
  -- feed -> calorie, g, kg, oz, lb, cup
  (1, 16),
  (1, 2),
  (1, 5),
  (1, 3),
  (1, 4),
  (1, 10),

  -- water -> mL, L, fl oz, cup
  (2, 6),
  (2, 11),
  (2, 9),
  (2, 10),

  -- treat -> calorie, treat
  (3, 16),
  (3, 15),

  -- walk -> km, mi
  (9, 12),
  (9, 13),

  -- medicine -> mg, mL, tsp, tbsp, pill
  (12, 1),
  (12, 6),
  (12, 7),
  (12, 8),
  (12, 14),

  -- weight -> g, kg, oz, lb
  (14, 2),
  (14, 5),
  (14, 3),
  (14, 4),

  -- custom -> all units (1 through 16)
  (20, 1),
  (20, 2),
  (20, 3),
  (20, 4),
  (20, 5),
  (20, 6),
  (20, 7),
  (20, 8),
  (20, 9),
  (20, 10),
  (20, 11),
  (20, 12),
  (20, 13),
  (20, 14),
  (20, 15),
  (20, 16);
 
 ALTER TABLE developmentHound.dogLogs RENAME COLUMN logUnit to DEPRECIATED_logUnit;
ALTER TABLE developmentHound.dogLogs  ADD COLUMN logUnitTypeId bigint(20) UNSIGNED NULL AFTER DEPRECIATED_logUnit;
ALTER TABLE developmentHound.dogLogs MODIFY COLUMN DEPRECIATED_logUnit varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL NULL;


DROP TRIGGER IF EXISTS BEFORE_UPDATE_dogLogs_CHECK_logIsDeleted;

UPDATE developmentHound.dogLogs AS dl
	JOIN developmentHound.logUnitType  AS lut
    ON dl.DEPRECIATED_logUnit = lut.readableValue
	SET dl.logUnitTypeId = lut.logUnitTypeId;

CREATE TRIGGER BEFORE_UPDATE_dogLogs_CHECK_logIsDeleted
BEFORE UPDATE ON dogLogs
FOR EACH ROW
BEGIN
  IF OLD.logIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update log marked as deleted';
  END IF;
END;

ALTER TABLE developmentHound.dogLogs DROP CONSTRAINT dogLogs_UN_logUUID_dogUUID;
ALTER TABLE developmentHound.dogLogs ADD CONSTRAINT dl_UN_logUUID UNIQUE KEY (logUUID);

ALTER TABLE developmentHound.dogLogs DROP CONSTRAINT dogLogs_FK_logActionTypes;
ALTER TABLE developmentHound.dogLogs ADD CONSTRAINT dl_FK_logActionType FOREIGN KEY (logActionTypeId) REFERENCES logActionType (logActionTypeId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogLogs DROP CONSTRAINT dogLogs_FK_dogs;
ALTER TABLE developmentHound.dogLogs ADD CONSTRAINT dl_FK_dogs FOREIGN KEY (dogUUID) REFERENCES dogs (dogUUID) ON UPDATE RESTRICT ON DELETE RESTRICT;

 ALTER TABLE developmentHound.dogReminders DROP CONSTRAINT dogReminders_UN_reminderUUID_dogUUID;
 ALTER TABLE developmentHound.dogReminders DROP CONSTRAINT dogReminders_FK_dogs;
 ALTER TABLE developmentHound.dogReminders DROP CONSTRAINT dr_FK_reminderActionTypes;
ALTER TABLE developmentHound.dogReminders ADD CONSTRAINT dr_UN_reminderUUID UNIQUE KEY (reminderUUID);
 ALTER TABLE developmentHound.dogReminders ADD CONSTRAINT dr_FK_dogs FOREIGN KEY (dogUUID) REFERENCES dogs (dogUUID) ON UPDATE RESTRICT ON DELETE RESTRICT;
 ALTER TABLE developmentHound.dogReminders ADD CONSTRAINT dr_FK_reminderActionType FOREIGN KEY (reminderActionTypeId) REFERENCES reminderActionType (reminderActionTypeId) ON UPDATE RESTRICT ON DELETE RESTRICT;


ALTER TABLE developmentHound.dogTriggerLogActionReaction DROP CONSTRAINT dogTriggersLogActionReactions_FK_dogTriggers;
ALTER TABLE developmentHound.dogTriggerLogActionReaction DROP CONSTRAINT dogTriggersLogActionReactions_FK_logActionTypes;
ALTER TABLE developmentHound.dogTriggerLogActionReaction DROP CONSTRAINT dogTriggersLogActionReactions_UN_triggerUUID_logActionTypeId;
ALTER TABLE developmentHound.dogTriggerLogActionReaction ADD CONSTRAINT dtlar_UN_triggerUUID_logActionTypeId UNIQUE KEY (triggerUUID, logActionTypeId);
ALTER TABLE developmentHound.dogTriggerLogActionReaction ADD CONSTRAINT dtlar_FK_dogTriggers FOREIGN KEY (triggerUUID) REFERENCES dogTriggers (triggerUUID) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE developmentHound.dogTriggerLogActionReaction ADD CONSTRAINT dtlar_FK_logActionType FOREIGN KEY (logActionTypeId) REFERENCES logActionType (logActionTypeId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogTriggerLogCustomActionNameReaction DROP CONSTRAINT dogTriggersLogCustomActionNameReactions_FK_dogTriggers;
ALTER TABLE developmentHound.dogTriggerLogCustomActionNameReaction DROP CONSTRAINT dtlcanr_UN_triggerUUID_logCustomActionName;
ALTER TABLE developmentHound.dogTriggerLogCustomActionNameReaction ADD CONSTRAINT dtlcanr_UN_triggerUUID_logCustomActionName UNIQUE KEY (triggerUUID, logCustomActionName);
ALTER TABLE developmentHound.dogTriggerLogCustomActionNameReaction ADD CONSTRAINT dtlcanr_FK_dogTriggers FOREIGN KEY (triggerUUID) REFERENCES dogTriggers (triggerUUID) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogTriggers DROP CONSTRAINT dogTriggers_FK_dogs;
ALTER TABLE developmentHound.dogTriggers DROP CONSTRAINT dt_FK_reminderActionType;

ALTER TABLE developmentHound.dogTriggers ADD CONSTRAINT dt_UN_triggerUUID_dogUUID UNIQUE KEY (triggerUUID, dogUUID);
ALTER TABLE developmentHound.dogTriggers DROP CONSTRAINT dogTriggers_UN_triggerUUID_dogUUID;

ALTER TABLE developmentHound.dogTriggers ADD CONSTRAINT dt_FK_dogs FOREIGN KEY (dogUUID) REFERENCES dogs (dogUUID) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE developmentHound.dogTriggers ADD CONSTRAINT dt_FK_reminderActionType FOREIGN KEY (resultReminderActionTypeId) REFERENCES reminderActionType (reminderActionTypeId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogs ADD CONSTRAINT d_FK_families FOREIGN KEY (familyId) REFERENCES families (familyId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.familyMembers ADD CONSTRAINT fm_FK_users FOREIGN KEY (userId) REFERENCES users (userId) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE developmentHound.familyMembers ADD CONSTRAINT fm_FK_families FOREIGN KEY (familyId) REFERENCES families (familyId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.families ADD CONSTRAINT f_FK_users FOREIGN KEY (familyHeadUserId) REFERENCES users (userId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.userConfiguration ADD CONSTRAINT uc_FK_users FOREIGN KEY (userId) REFERENCES users (userId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.surveyFeedbackAppExperience ADD CONSTRAINT sfae_FK_surveyFeedback FOREIGN KEY (surveyFeedbackId) REFERENCES surveyFeedback (surveyFeedbackId) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE developmentHound.surveyFeedbackCancelSubscription ADD CONSTRAINT sfcs_FK_surveyFeedback FOREIGN KEY (surveyFeedbackId) REFERENCES surveyFeedback (surveyFeedbackId) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE developmentHound.dogReminders ADD COLUMN reminderIsTriggerResult tinyint(1) NULL AFTER reminderType;
DROP TRIGGER BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted;
UPDATE developmentHound.dogReminders SET reminderIsTriggerResult = 0 WHERE reminderIsTriggerResult IS NULL;
CREATE TRIGGER BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted
BEFORE UPDATE ON dogReminders
FOR EACH ROW
BEGIN
  IF OLD.reminderIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update reminder marked as deleted';
  END IF;
END;
ALTER TABLE developmentHound.dogReminders MODIFY COLUMN reminderIsTriggerResult tinyint(1) NOT NULL AFTER reminderType;

RENAME TABLE developmentHound.mappingLogActionTypesLogUnitType TO mappingLogActionTypeLogUnitType;

-- dogTriggersLogActionReactions -> dogTriggerLogReactions
RENAME TABLE developmentHound.dogTriggerLogActionReaction TO developmentHound.dogTriggerLogReaction;

ALTER TABLE developmentHound.dogTriggerLogReaction DROP CONSTRAINT dtlar_FK_dogTriggers;
ALTER TABLE developmentHound.dogTriggerLogReaction DROP FOREIGN KEY dtlar_FK_logActionType;
ALTER TABLE developmentHound.dogTriggerLogReaction DROP INDEX dtlar_FK_logActionType;
ALTER TABLE developmentHound.dogTriggerLogReaction DROP CONSTRAINT dtlar_UN_triggerUUID_logActionTypeId;
ALTER TABLE developmentHound.dogTriggerLogReaction ADD COLUMN logCustomActionName VARCHAR(32) NOT NULL AFTER logActionTypeId;

ALTER TABLE developmentHound.dogTriggerLogReaction ADD CONSTRAINT dtlr_UN_triggerUUID_logActionTypeId_logCustomActionName UNIQUE KEY (triggerUUID, logActionTypeId, logCustomActionName);
ALTER TABLE developmentHound.dogTriggerLogReaction ADD CONSTRAINT dtlr_FK_dogTriggers FOREIGN KEY (triggerUUID) REFERENCES dogTriggers (triggerUUID) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE developmentHound.dogTriggerLogReaction ADD CONSTRAINT dtlr_FK_logActionType FOREIGN KEY (logActionTypeId) REFERENCES logActionType (logActionTypeId) ON UPDATE RESTRICT ON DELETE RESTRICT;
DROP TABLE developmentHound.dogTriggerLogCustomActionNameReaction;

-- dogTriggerReminderResult
CREATE TABLE developmentHound.dogTriggerReminderResult (
  reactionId                BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  triggerUUID             CHAR(36) NOT NULL,
  reminderActionTypeId    BIGINT(20) UNSIGNED NOT NULL,
  reminderCustomActionName VARCHAR(32) NOT NULL,
  PRIMARY KEY (reactionId),
  CONSTRAINT dtrr_UN_tUUID_rActionTypeId_rCustomActionName UNIQUE KEY (triggerUUID, reminderActionTypeId, reminderCustomActionName),
  CONSTRAINT dtrr_FK_dogTriggers FOREIGN KEY (triggerUUID) REFERENCES dogTriggers (triggerUUID) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT dtrr_FK_reminderActionType FOREIGN KEY (reminderActionTypeId) REFERENCES reminderActionType (reminderActionTypeId) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
 
 ALTER TABLE developmentHound.dogTriggers DROP COLUMN triggerCustomName;

-- trigger condition columns
ALTER TABLE developmentHound.dogTriggers ADD COLUMN triggerManualCondition TINYINT(1) NOT NULL;
ALTER TABLE developmentHound.dogTriggers ADD COLUMN triggerAlarmCreatedCondition TINYINT(1) NOT NULL;
ALTER TABLE developmentHound.dogLogs ADD COLUMN logCreatedByReminderUUID CHAR(36) NULL;

-- userConfigurationIsHapticsEnabled 
ALTER TABLE developmentHound.userConfiguration ADD userConfigurationIsHapticsEnabled tinyint(1) DEFAULT 1 NOT NULL;
ALTER TABLE developmentHound.userConfiguration MODIFY COLUMN userConfigurationIsHapticsEnabled tinyint(1) NOT NULL;
-- userConfigurationUsesDeviceTimeZone
ALTER TABLE developmentHound.userConfiguration ADD userConfigurationUsesDeviceTimeZone tinyint(1) DEFAULT 1 NOT NULL;
ALTER TABLE developmentHound.userConfiguration MODIFY COLUMN userConfigurationUsesDeviceTimeZone tinyint(1) NOT NULL;
-- userConfigurationUserTimeZone
ALTER TABLE developmentHound.userConfiguration ADD userConfigurationUserTimeZone varchar(100) NULL;

-- dogReminderRecipient
CREATE TABLE developmentHound.dogReminderRecipient (
  recipientId                   BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  reminderUUID                 CHAR(36)             NOT NULL,
  userId                     CHAR(64)             NOT NULL,
  PRIMARY KEY (recipientId),
  UNIQUE KEY drr_UN_reminderUUID_userId (reminderUUID, userId)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;
 
ALTER TABLE developmentHound.dogReminderRecipient
  ADD CONSTRAINT drr_FK_dogReminders
    FOREIGN KEY (reminderUUID)
    REFERENCES developmentHound.dogReminders (reminderUUID)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  ADD CONSTRAINT drr_FK_users
    FOREIGN KEY (userId)
    REFERENCES developmentHound.users (userId)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT;
   
INSERT INTO developmentHound.dogReminderRecipient (reminderUUID, userId)
SELECT
    dr.reminderUUID,
    fm.userId
FROM developmentHound.dogReminders dr
JOIN developmentHound.dogs d
    ON dr.dogUUID = d.dogUUID
JOIN developmentHound.familyMembers fm
    ON d.familyId = fm.familyId
WHERE
    dr.reminderIsDeleted = 0
    AND d.dogIsDeleted = 0; 
   
-- dogReminder renames
ALTER TABLE developmentHound.dogReminders DROP CONSTRAINT CHECK_monthly;
ALTER TABLE developmentHound.dogReminders DROP CONSTRAINT CHECK_weekly;
   
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyUTCHour TO weeklyZonedHour;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyUTCMinute TO weeklyZonedMinute;

ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklySunday TO weeklyZonedSunday;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyMonday TO weeklyZonedMonday;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyTuesday TO weeklyZonedTuesday;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyWednesday TO weeklyZonedWednesday;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyThursday TO weeklyZonedThursday;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklyFriday TO weeklyZonedFriday;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN weeklySaturday TO weeklyZonedSaturday;

ALTER TABLE developmentHound.dogReminders RENAME COLUMN monthlyUTCDay TO monthlyZonedDay;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN monthlyUTCHour TO monthlyZonedHour;
ALTER TABLE developmentHound.dogReminders RENAME COLUMN monthlyUTCMinute TO monthlyZonedMinute;

ALTER TABLE developmentHound.dogReminders ADD CONSTRAINT dr_CHECK_monthlyZoned
  CHECK (
    monthlyZonedHour >= 0 AND monthlyZonedHour <= 23 AND
    monthlyZonedMinute >= 0 AND monthlyZonedMinute <= 59 AND
    monthlyZonedDay >= 0 AND monthlyZonedDay <= 31
  );

ALTER TABLE developmentHound.dogReminders ADD CONSTRAINT dr_CHECK_weeklyZoned
  CHECK (
    weeklyZonedHour >= 0 AND weeklyZonedHour <= 23 AND
    weeklyZonedMinute >= 0 AND weeklyZonedMinute <= 59 AND
    (
      weeklyZonedSunday = 1 OR weeklyZonedMonday = 1 OR weeklyZonedTuesday = 1 OR
      weeklyZonedWednesday = 1 OR weeklyZonedThursday = 1 OR weeklyZonedFriday = 1 OR
      weeklyZonedSaturday = 1
    )
  );
 
 -- reminderTimeZone
 ALTER TABLE developmentHound.dogReminders ADD COLUMN reminderTimeZone VARCHAR(100) NOT NULL DEFAULT 'UTC';
 ALTER TABLE developmentHound.dogReminders MODIFY COLUMN reminderTimeZone VARCHAR(100) NOT NULL;
 

 



