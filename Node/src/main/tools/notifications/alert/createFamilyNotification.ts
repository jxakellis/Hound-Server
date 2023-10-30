import { alertLogger } from '../../../logging/loggers.js';
import { getDatabaseConnections } from '../../../database/databaseConnections.js';

import { logServerError } from '../../../logging/logServerError.js';
import { getPublicUser } from '../../../../controllers/getFor/getForUser.js';
import { sendNotificationForFamilyExcludingUser } from '../apn/sendNotification.js';
import { formatIntoName } from '../../../format/formatName.js';
import { NOTIFICATION } from '../../../server/globalConstants.js';
import { HoundError } from '../../../server/globalErrors.js';

/**
 * Helper function for createFamilyMemberJoinNotification, createFamilyMemberLeaveNotification, createFamilyLockedNotification, and createFamilyPausedNotification
 */
async function abbreviatedFullNameForUserId(userId: string): Promise<string> {
  const { databaseConnectionForGeneral } = await getDatabaseConnections();

  const result = await getPublicUser(databaseConnectionForGeneral, userId);

  return formatIntoName(true, result?.userFirstName, result?.userLastName);
}

/**
 * Sends an alert to all of the family members that a new member has joined
 */
async function createFamilyMemberJoinNotification(userId: string, familyId: string): Promise<void> {
  try {
    alertLogger.debug(`createFamilyMemberJoinNotification ${userId}, ${familyId}`);

    const abbreviatedFullName = await abbreviatedFullNameForUserId(userId);

    // now we can construct the messages
    // Maximum possible length of message: 30 (raw) + 0 (variable) = 30 ( <= ALERT_TITLE_LIMIT )
    const alertTitle = '🧍 A family member has joined!';

    // Maximum possible length of message: 31 (raw) + 34 (variable) = 65 ( <= ALERT_BODY_LIMIT )
    const alertBody = `Welcome ${abbreviatedFullName} into your Hound family`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, NOTIFICATION.CATEGORY.FAMILY.JOIN, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createFamilyMemberJoinNotification',
        createFamilyMemberJoinNotification,
        undefined,
        error,
      ),
    );
  }
}

/**
 * Sends an alert to all of the family members that one of them has left
 */
async function createFamilyMemberLeaveNotification(userId: string, familyId: string): Promise<void> {
  try {
    alertLogger.debug(`createFamilyMemberLeaveNotification ${userId}, ${familyId}`);

    const abbreviatedFullName = await abbreviatedFullNameForUserId(userId);

    // now we can construct the messages
    // Maximum possible length of message: 28 (raw) + 0 (variable) = 28 ( <= ALERT_TITLE_LIMIT )
    const alertTitle = '🧍 A family member has left!';

    // Maximum possible length of message: 39 (raw) + 34 (variable) = 73 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abbreviatedFullName} has parted ways with your Hound family`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, NOTIFICATION.CATEGORY.FAMILY.LEAVE, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createFamilyMemberLeaveNotification',
        createFamilyMemberLeaveNotification,
        undefined,
        error,
      ),
    );
  }
}

/**
 * Sends an alert to all of the family members that one of them has left
 */
async function createFamilyLockedNotification(userId: string, familyId: string, familyIsLocked: boolean): Promise<void> {
  try {
    alertLogger.debug(`createFamilyLockedNotification ${userId}, ${familyId}, ${familyIsLocked}`);

    const abbreviatedFullName = await abbreviatedFullNameForUserId(userId);

    // now we can construct the messages
    // Maximum possible length of message: 30/32 (raw) + 0 (variable) = 30/32 ( <= ALERT_TITLE_LIMIT )
    const alertTitle = familyIsLocked
      ? '🧍 Your family has been locked'
      : '🧍 Your family has been unlocked';

    // Maximum possible length of message: 65/58 (raw) + 34 (variable) = 99/92 ( <= ALERT_BODY_LIMIT )
    const alertBody = familyIsLocked
      ? `${abbreviatedFullName}'s updated your family settings to prevent new users from joining`
      : `${abbreviatedFullName}'s updated your family settings to allow new users to join`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, NOTIFICATION.CATEGORY.FAMILY.LOCK, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createFamilyLockedNotification',
        createFamilyLockedNotification,
        undefined,
        error,
      ),
    );
  }
}

export {
  createFamilyMemberJoinNotification,
  createFamilyMemberLeaveNotification,
  createFamilyLockedNotification,
};
