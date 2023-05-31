const { areAllDefined } = require('../../main/tools/format/validateDefined');
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

    if (areAllDefined(userIdentifier) === false) {
      throw new ValidationError('userIdentifier missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }

    const result = await getUserForUserIdentifier(req.databaseConnection, userIdentifier);

    if (areAllDefined(result) === false) {
      throw new ValidationError('No user found or invalid permissions', global.CONSTANT.ERROR.PERMISSION.NO.USER);
    }

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
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
      userConfigurationIsLoudNotificationEnabled,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      userConfigurationIsSilentModeEnabled,
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
      userConfigurationIsLoudNotificationEnabled,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      // userConfigurationPreviousDogManagerSynchronization,
      userConfigurationIsSilentModeEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    );

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const {
      userNotificationToken,
      userConfigurationIsNotificationEnabled,
      // userConfigurationIsLoudNotificationEnabled,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      // userConfigurationIsSilentModeEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    } = req.body;
    // < 2.1.0 userConfigurationIsLoudNotificationEnabled
    const userConfigurationIsLoudNotificationEnabled = req.body.userConfigurationIsLoudNotificationEnabledEnabled ?? req.body.userConfigurationIsLoudNotificationEnabled;
    // < 2.1.0 userConfigurationIsSilentModeEnabled
    const userConfigurationIsSilentModeEnabled = req.body.userConfigurationIsSilentModeEnabled ?? req.body.userConfigurationIsSilentModeEnabled;
    await updateUserForUserId(
      req.databaseConnection,
      userId,
      userNotificationToken,
      userConfigurationIsNotificationEnabled,
      userConfigurationIsLoudNotificationEnabled,
      userConfigurationIsLogNotificationEnabled,
      userConfigurationIsReminderNotificationEnabled,
      userConfigurationInterfaceStyle,
      userConfigurationSnoozeLength,
      userConfigurationNotificationSound,
      userConfigurationLogsInterfaceScale,
      userConfigurationRemindersInterfaceScale,
      userConfigurationIsSilentModeEnabled,
      userConfigurationSilentModeStartUTCHour,
      userConfigurationSilentModeEndUTCHour,
      userConfigurationSilentModeStartUTCMinute,
      userConfigurationSilentModeEndUTCMinute,
    );

    return res.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

module.exports = {
  getUser, createUser, updateUser,
};
