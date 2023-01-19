const { ValidationError } = require('../../main/tools/general/errors');
const { atLeastOneDefined, areAllDefined } = require('../../main/tools/format/validateDefined');

const { getUserForUserId, getUserForUserIdentifier } = require('../getFor/getForUser');
const { createUserForUserIdentifier } = require('../createFor/createForUser');
const { updateUserForUserId } = require('../updateFor/updateForUser');

/*
Known:
- (if appliciable to controller) userId formatted correctly and request has sufficient permissions to use
*/

async function getUser(req, res) {
  try {
    // hound userId
    const { userId } = req.params;
    // apple userIdentifier
    const { userIdentifier } = req.query;

    if (atLeastOneDefined(userId, userIdentifier) === false) {
      throw new ValidationError('userId or userIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }

    const result = areAllDefined(userId)
    // user provided userId so we go that route
      ? await getUserForUserId(req.databaseConnection, userId)
    // user provided userIdentifier so we find them using that way
      : await getUserForUserIdentifier(req.databaseConnection, userIdentifier);

    if (areAllDefined(result) === false) {
      throw new ValidationError('No user found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.USER);
    }

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function createUser(req, res) {
  try {
    const {
      userIdentifier,
      userEmail,
      userFirstName,
      userLastName,
      userNotificationToken,
      userConfigurationIsNotificationEnabled,
      userConfigurationIsLoudNotification,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      userConfigurationSilentModeIsEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    } = req.body;
    const result = await createUserForUserIdentifier(
      req.databaseConnection,
      // userId,
      userIdentifier,
      // userApplicationUsername,
      userEmail,
      userFirstName,
      userLastName,
      userNotificationToken,
      // userAccountCreationDate,
      userConfigurationIsNotificationEnabled,
      userConfigurationIsLoudNotification,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      // userConfigurationPreviousDogManagerSynchronization,
      userConfigurationSilentModeIsEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    );

    return res.sendResponseForStatusJSONError(200, { result: areAllDefined(result) ? result : '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const {
      userNotificationToken,
      userConfigurationIsNotificationEnabled,
      userConfigurationIsLoudNotification,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      userConfigurationSilentModeIsEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    } = req.body;
    await updateUserForUserId(
      req.databaseConnection,
      userId,
      userNotificationToken,
      userConfigurationIsNotificationEnabled,
      userConfigurationIsLoudNotification,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      userConfigurationSilentModeIsEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    );

    return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

module.exports = {
  getUser, createUser, updateUser,
};
