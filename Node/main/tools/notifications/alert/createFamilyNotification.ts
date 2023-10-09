import { alertLogger } from '../../logging/loggers';
import { databaseConnectionForGeneral } from '../../../database/createDatabaseConnections';
import { formatBoolean } from '../../format/formatObject';

import { logServerError } from '../../logging/logServerError';
import { getUserFirstNameLastNameForUserId } from '../../../../controllers/getFor/getForUser';
import { sendNotificationForFamilyExcludingUser } from '../apn/sendNotification';
import { formatIntoName } from '../../format/formatName';

/**
 * Sends an alert to all of the family members that a new member has joined
 */
async function createFamilyMemberJoinNotification(userId: string, familyId: string) {
  try {
    alertLogger.debug(`createFamilyMemberJoinNotification ${userId}, ${familyId}`);

    const abreviatedFullName = await abreviatedFullNameForUserId(userId);

    if (areAllDefined(abreviatedFullName) === false) {
      return;
    }

    // now we can construct the messages
    // Maximum possible length of message: 30 (raw) + 0 (variable) = 30 ( <= ALERT_TITLE_LIMIT )
    const alertTitle = '🧍 A family member has joined!';

    // Maximum possible length of message: 31 (raw) + 34 (variable) = 65 ( <= ALERT_BODY_LIMIT )
    const alertBody = `Welcome ${abreviatedFullName} into your Hound family`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, global.CONSTANT.NOTIFICATION.CATEGORY.FAMILY.JOIN, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError('createFamilyMemberJoinNotification', error);
  }
}

/**
 * Sends an alert to all of the family members that one of them has left
 */
async function createFamilyMemberLeaveNotification(userId, familyId) {
  try {
    alertLogger.debug(`createFamilyMemberLeaveNotification ${userId}, ${familyId}`);

    // make sure all params are defined
    if (areAllDefined(userId, familyId) === false) {
      return;
    }

    const abreviatedFullName = await abreviatedFullNameForUserId(userId);

    if (areAllDefined(abreviatedFullName) === false) {
      return;
    }

    // now we can construct the messages
    // Maximum possible length of message: 28 (raw) + 0 (variable) = 28 ( <= ALERT_TITLE_LIMIT )
    const alertTitle = '🧍 A family member has left!';

    // Maximum possible length of message: 39 (raw) + 34 (variable) = 73 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abreviatedFullName} has parted ways with your Hound family`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, global.CONSTANT.NOTIFICATION.CATEGORY.FAMILY.LEAVE, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError('createFamilyMemberLeaveNotification', error);
  }
}

/**
 * Sends an alert to all of the family members that one of them has left
 */
async function createFamilyLockedNotification(userId, familyId, newIsLocked) {
  try {
    alertLogger.debug(`createFamilyLockedNotification ${userId}, ${familyId}, ${newIsLocked}`);

    const familyIsLocked = formatBoolean(newIsLocked);
    // make sure all params are defined
    if (areAllDefined(userId, familyId, familyIsLocked) === false) {
      return;
    }

    const abreviatedFullName = await abreviatedFullNameForUserId(userId);

    if (areAllDefined(abreviatedFullName) === false) {
      return;
    }

    // now we can construct the messages
    // Maximum possible length of message: 30/32 (raw) + 0 (variable) = 30/32 ( <= ALERT_TITLE_LIMIT )
    const alertTitle = familyIsLocked
      ? '🧍 Your family has been locked'
      : '🧍 Your family has been unlocked';

    // Maximum possible length of message: 65/58 (raw) + 34 (variable) = 99/92 ( <= ALERT_BODY_LIMIT )
    const alertBody = familyIsLocked
      ? `${abreviatedFullName}'s updated your family settings to prevent new users from joining`
      : `${abreviatedFullName}'s updated your family settings to allow new users to join`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, global.CONSTANT.NOTIFICATION.CATEGORY.FAMILY.LOCK, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError('createFamilyLockedNotification', error);
  }
}

/**
 * Helper function for createFamilyMemberJoinNotification, createFamilyMemberLeaveNotification, createFamilyLockedNotification, and createFamilyPausedNotification
 */
async function abreviatedFullNameForUserId(userId: string) {
  const result = await getUserFirstNameLastNameForUserId(databaseConnectionForGeneral, userId);

  if (areAllDefined(result) === false) {
    return null;
  }

  if (areAllDefined(result.userFirstName, result.userLastName) === false) {
    return null;
  }

  const abreviatedFullName = formatIntoAbreviatedFullName(result.userFirstName, result.userLastName);

  return abreviatedFullName;
}

export {
  createFamilyMemberJoinNotification,
  createFamilyMemberLeaveNotification,
  createFamilyLockedNotification,
};
