import { apnLogger } from '../../../logging/loggers.js';

import { logServerError } from '../../../logging/logServerError.js';

import { sendAPN } from './sendAPN.js';
import { getUserToken, getAllFamilyMemberTokens, getOtherFamilyMemberTokens } from './apnTokens.js';
import { HoundError } from '../../../server/globalErrors.js';
import { type Dictionary } from '../../../types/Dictionary.js';

/**
* Takes a userId and retrieves the userNotificationToken for the user
* Invokes sendAPN with the tokens, alertTitle, and alertBody
*/
async function sendNotificationForUser(userId: string, category: string, alertTitle: string, alertBody: string, customPayload: Dictionary): Promise<void> {
  apnLogger.debug(`sendNotificationForUser ${userId}, ${category}, ${alertTitle}, ${alertBody}`);

  try {
    // get tokens of all qualifying family members that aren't the user
    const userNotificationConfiguration = await getUserToken(userId);

    if (userNotificationConfiguration === undefined) {
      return;
    }

    sendAPN(userNotificationConfiguration, category, alertTitle, alertBody, customPayload);
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendNotificationForUser',
        sendNotificationForUser,
        undefined,
        error,
      ),
    );
  }
}

/**
 * Takes a familyId and retrieves the userNotificationToken for all familyMembers
 * Invokes sendAPN with the tokens, alertTitle, and alertBody
 */
async function sendNotificationForFamily(familyId: string, category: string, alertTitle: string, alertBody: string, customPayload: Dictionary): Promise<void> {
  apnLogger.debug(`sendNotificationForFamily ${familyId}, ${category}, ${alertTitle}, ${alertBody}, ${customPayload}`);

  try {
    // get notification tokens of all qualifying family members
    const userNotificationConfigurations = await getAllFamilyMemberTokens(familyId);

    if (userNotificationConfigurations === undefined) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    userNotificationConfigurations.forEach((userNotificationConfiguration) => sendAPN(userNotificationConfiguration, category, alertTitle, alertBody, customPayload));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendNotificationForFamily',
        sendNotificationForFamily,
        undefined,
        error,
      ),
    );
  }
}

/**
 * Takes a familyId and retrieves the userNotificationToken for all familyMembers (excluding the userId provided)
 * Invokes sendAPN with the tokens, alertTitle, and alertBody
 */
async function sendNotificationForFamilyExcludingUser(
  userId: string,
  familyId: string,
  category: string,
  alertTitle: string,
  alertBody: string,
  customPayload: Dictionary,
): Promise<void> {
  apnLogger.debug(`sendNotificationForFamilyExcludingUser ${userId}, ${familyId}, ${category}, ${alertTitle}, ${alertBody}, ${customPayload}`);

  try {
    // get tokens of all qualifying family members that aren't the user
    const userNotificationConfigurations = await getOtherFamilyMemberTokens(userId, familyId);

    if (userNotificationConfigurations === undefined) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    userNotificationConfigurations.forEach((userNotificationConfiguration) => sendAPN(userNotificationConfiguration, category, alertTitle, alertBody, customPayload));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendNotificationForFamilyExcludingUser',
        sendNotificationForFamilyExcludingUser,
        undefined,
        error,
      ),
    );
  }
}

export {
  sendNotificationForUser, sendNotificationForFamily, sendNotificationForFamilyExcludingUser,
};
