const { apnLogger } from '../../logging/loggers';

const { logServerError } from '../../logging/logServerError';
const { formatArray } from '../../format/formatObject';
const { areAllDefined } from '../../validate/validateDefined';

const { sendAPN } from './sendAPN';
const { getUserToken, getAllFamilyMemberTokens, getOtherFamilyMemberTokens } from './apnTokens';

/**
* Takes a userId and retrieves the userNotificationToken for the user
* Invokes sendAPN with the tokens, alertTitle, and alertBody
*/
async function sendNotificationForUser(userId, category, alertTitle, alertBody, customPayload) {
  apnLogger.debug(`sendNotificationForUser ${userId}, ${category}, ${alertTitle}, ${alertBody}`);

  if (areAllDefined(userId) === false) {
    return;
  }

  try {
    // get tokens of all qualifying family members that aren't the user
    const userNotificationConfiguration = formatArray(await getUserToken(userId));

    if (areAllDefined(userNotificationConfiguration, category, alertTitle, alertBody, customPayload) === false || userNotificationConfiguration.length === 0) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    for (let i = 0; i < userNotificationConfiguration.length; i += 1) {
      sendAPN(userNotificationConfiguration[i], category, alertTitle, alertBody, customPayload);
    }
  }
  catch (error) {
    logServerError('sendNotificationForUser', error);
  }
}

/**
 * Takes a familyId and retrieves the userNotificationToken for all familyMembers
 * Invokes sendAPN with the tokens, alertTitle, and alertBody
 */
async function sendNotificationForFamily(familyId, category, alertTitle, alertBody, customPayload) {
  apnLogger.debug(`sendNotificationForFamily ${familyId}, ${category}, ${alertTitle}, ${alertBody}, ${customPayload}`);

  try {
    // get notification tokens of all qualifying family members
    const userNotificationConfiguration = formatArray(await getAllFamilyMemberTokens(familyId));

    if (areAllDefined(userNotificationConfiguration, category, alertTitle, alertBody, customPayload) === false || userNotificationConfiguration.length === 0) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    for (let i = 0; i < userNotificationConfiguration.length; i += 1) {
      sendAPN(userNotificationConfiguration[i], category, alertTitle, alertBody, customPayload);
    }
  }
  catch (error) {
    logServerError('sendNotificationForFamily', error);
  }
}

/**
 * Takes a familyId and retrieves the userNotificationToken for all familyMembers (excluding the userId provided)
 * Invokes sendAPN with the tokens, alertTitle, and alertBody
 */
async function sendNotificationForFamilyExcludingUser(userId, familyId, category, alertTitle, alertBody, customPayload) {
  apnLogger.debug(`sendNotificationForFamilyExcludingUser ${userId}, ${familyId}, ${category}, ${alertTitle}, ${alertBody}, ${customPayload}`);

  try {
    // get tokens of all qualifying family members that aren't the user
    const userNotificationConfiguration = formatArray(await getOtherFamilyMemberTokens(userId, familyId));

    if (areAllDefined(userNotificationConfiguration, category, alertTitle, alertBody, customPayload) === false || userNotificationConfiguration.length === 0) {
      return;
    }

    // sendAPN if there are > 0 user notification tokens
    for (let i = 0; i < userNotificationConfiguration.length; i += 1) {
      sendAPN(userNotificationConfiguration[i], category, alertTitle, alertBody, customPayload);
    }
  }
  catch (error) {
    logServerError('sendNotificationForFamilyExcludingUser', error);
  }
}

export {
  sendNotificationForUser, sendNotificationForFamily, sendNotificationForFamilyExcludingUser,
};
