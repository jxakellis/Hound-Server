const { atLeastOneDefined, areAllDefined } = require('../../main/tools/format/validateDefined');
const { ValidationError } = require('../../main/tools/general/errors');

const { getUserForUserIdentifier } = require('../getFor/getForUser');

const { createUserForUserIdentifier } = require('../createFor/createForUser');

const { updateUserForUserId } = require('../updateFor/updateForUser');

/*
Known:
- (if appliciable to controller) userId formatted correctly and request has sufficient permissions to use
*/

async function getUser(req, res) {
  try {
    // apple userIdentifier
    const { userIdentifier } = req.query;

    if (atLeastOneDefined(userIdentifier) === false) {
      throw new ValidationError('userIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }

    const result = await getUserForUserIdentifier(req.databaseConnection, userIdentifier);

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
    } = req.query;
    const {
      userEmail,
      userFirstName,
      userLastName,
      userNotificationToken,
      userConfigurationIsNotificationEnabled,
      // userConfigurationIsLoudNotification,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      // userConfigurationSilentModeIsEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    } = req.body;

    // < 2.1.0 userConfigurationIsLoudNotification
    const userConfigurationIsLoudNotification = req.body.userConfigurationIsLoudNotificationEnabled ?? req.body.userConfigurationIsLoudNotification;
    // < 2.1.0 userConfigurationSilentModeIsEnabled
    const userConfigurationSilentModeIsEnabled = req.body.userConfigurationIsSilentModeEnabled ?? req.body.userConfigurationSilentModeIsEnabled;
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
      // userConfigurationIsLoudNotification,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      // userConfigurationSilentModeIsEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    } = req.body;
    // < 2.1.0 userConfigurationIsLoudNotification
    const userConfigurationIsLoudNotification = req.body.userConfigurationIsLoudNotificationEnabled ?? req.body.userConfigurationIsLoudNotification;
    // < 2.1.0 userConfigurationSilentModeIsEnabled
    const userConfigurationSilentModeIsEnabled = req.body.userConfigurationIsSilentModeEnabled ?? req.body.userConfigurationSilentModeIsEnabled;
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
