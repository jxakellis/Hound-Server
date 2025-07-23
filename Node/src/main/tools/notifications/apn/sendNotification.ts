import { apnLogger } from '../../../logging/loggers.js';

import { logServerError } from '../../../logging/logServerError.js';

import { sendAPN } from './sendAPN.js';
import {
  getUserToken, getAllFamilyMemberTokens, getOtherFamilyMemberTokens, getFamilyMemberTokensForUserIds,
} from './apnTokens.js';
import { HoundError } from '../../../server/globalErrors.js';
import { type StringKeyDict } from '../../../types/StringKeyDict.js';

/**
* Takes a userId and retrieves the userNotificationToken for the user
* Invokes sendAPN with the tokens, alertTitle, and alertBody
*/
async function sendNotificationForUser(userId: string, category: string, alertTitle: string, alertBody: string, customPayload: StringKeyDict): Promise<void> {
  apnLogger.debug(`sendNotificationForUser ${userId}, ${category}, ${alertTitle}, ${alertBody}`);

  try {
    // get tokens of all qualifying family members that aren't the user
    const userNotificationConfiguration = await getUserToken(userId);

    if (userNotificationConfiguration === undefined || userNotificationConfiguration === null) {
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

async function sendNotificationForFamilyMembers(
  familyId: string,
  userIds: string[],
  category: string,
  alertTitle: string,
  alertBody: string,
  customPayload: StringKeyDict,
): Promise<void> {
  apnLogger.debug(`sendNotificationForFamilyMembers ${familyId}, ${userIds}, ${category}, ${alertTitle}`);

  try {
    const userNotificationConfigurations = await getFamilyMemberTokensForUserIds(familyId, userIds);

    if (userNotificationConfigurations === undefined || userNotificationConfigurations === null) {
      return;
    }

    userNotificationConfigurations.forEach((c) => sendAPN(c, category, alertTitle, alertBody, customPayload));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendNotificationForFamilyMembers',
        sendNotificationForFamilyMembers,
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
async function sendNotificationForAllFamily(familyId: string, category: string, alertTitle: string, alertBody: string, customPayload: StringKeyDict): Promise<void> {
  apnLogger.debug(`sendNotificationForAllFamily ${familyId}, ${category}, ${alertTitle}, ${alertBody}, ${customPayload}`);

  try {
    // get notification tokens of all qualifying family members
    const userNotificationConfigurations = await getAllFamilyMemberTokens(familyId);

    if (userNotificationConfigurations === undefined || userNotificationConfigurations === null) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    userNotificationConfigurations.forEach((userNotificationConfiguration) => sendAPN(userNotificationConfiguration, category, alertTitle, alertBody, customPayload));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendNotificationForAllFamily',
        sendNotificationForAllFamily,
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
async function sendNotificationForAllFamilyExcludingUser(
  userId: string,
  familyId: string,
  category: string,
  alertTitle: string,
  alertBody: string,
  customPayload: StringKeyDict,
): Promise<void> {
  apnLogger.debug(`sendNotificationForAllFamilyExcludingUser ${userId}, ${familyId}, ${category}, ${alertTitle}, ${alertBody}, ${customPayload}`);

  try {
    // get tokens of all qualifying family members that aren't the user
    const userNotificationConfigurations = await getOtherFamilyMemberTokens(userId, familyId);

    if (userNotificationConfigurations === undefined || userNotificationConfigurations === null) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    userNotificationConfigurations.forEach((userNotificationConfiguration) => sendAPN(userNotificationConfiguration, category, alertTitle, alertBody, customPayload));
  }
  catch (error) {
    logServerError(
      new HoundError(
        'sendNotificationForAllFamilyExcludingUser',
        sendNotificationForAllFamilyExcludingUser,
        undefined,
        error,
      ),
    );
  }
}

export {
  sendNotificationForUser, sendNotificationForFamilyMembers, sendNotificationForAllFamily, sendNotificationForAllFamilyExcludingUser,
};
