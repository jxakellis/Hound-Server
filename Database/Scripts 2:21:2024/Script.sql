DROP TRIGGER developmentHound.BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted;

UPDATE dogReminders SET reminderUUID = UUID();

DELIMITER $$
$$
CREATE DEFINER=`admin`@`%` TRIGGER BEFORE_UPDATE_dogReminders_CHECK_reminderIsDeleted
  BEFORE UPDATE 
  ON dogReminders
  FOR EACH ROW
BEGIN
  IF OLD.reminderIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update reminder marked as deleted';
  END IF;
END;
$$
DELIMITER ;

DROP TRIGGER developmentHound.BEFORE_UPDATE_dogs_CHECK_dogIsDeleted;

UPDATE dogs SET dogUUID = UUID();

DELIMITER $$
$$
CREATE DEFINER=`admin`@`%` TRIGGER BEFORE_UPDATE_dogs_CHECK_dogIsDeleted
	BEFORE UPDATE 
	ON dogs FOR EACH ROW
BEGIN
  IF OLD.dogIsDeleted = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unable to update dog marked as deleted';
  END IF;
END;
$$
DELIMITER ;