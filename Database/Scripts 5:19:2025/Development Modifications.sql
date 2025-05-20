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
  ('feed',             'Feed',             '🍗',  1),
  ('water',            'Fresh Water',      '🚰',  2),
  ('treat',            'Treat',            '🦴',  3),
  ('pee',              'Pee',              '💦',  4),
  ('poo',              'Poo',              '💩',  5),
  ('both',             'Pee & Poo',        '🧻',  6),
  ('neither',          'Didn\'t Go Potty', '🚫',  7),
  ('accident',         'Accident',         '🚨',  8),
  ('walk',             'Walk',             '🦮',  9),
  ('brush',            'Brush',            '💈', 10),
  ('bathe',            'Bathe',            '🛁', 11),
  ('medicine',         'Medicine',         '💊', 12),
  ('vaccine',          'Vaccine',          '💉', 13),
  ('weight',           'Weight',           '⚖️', 14),
  ('wakeUp',           'Wake Up',          '☀️', 15),
  ('sleep',            'Sleep',            '💤', 16),
  ('crate',            'Crate',            '🏡', 17),
  ('trainingSession',  'Training Session', '🎓', 18),
  ('doctor',           'Doctor Visit',     '🩺', 19),
  ('custom',           'Custom',           '📝', 20);

ALTER TABLE developmentHound.dogLogs  ADD COLUMN `logActionTypeId` bigint(20) UNSIGNED NULL AFTER `logAction`;

DROP TRIGGER IF EXISTS BEFORE_UPDATE_dogLogs_CHECK_logIsDeleted;

UPDATE developmentHound.dogLogs AS dl
	JOIN developmentHound.logActionTypes AS lat
    ON dl.logAction = lat.internalValue
	SET dl.logActionTypeId = lat.logActionTypeId;

ALTER TABLE developmentHound.dogLogs RENAME COLUMN logAction to DEPRECIATED_logAction;

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
  ('potty', 'Potty', '🚰',  15, 0),
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


 

