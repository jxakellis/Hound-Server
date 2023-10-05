import express from 'express';
const { areAllDefined } from '../../main/tools/validate/validateDefined';
const { ValidationError } from '../../main/server/globalErrors';

const { getUserForUserIdentifier } from '../getFor/getForUser';

const { createUserForUserIdentifier } from '../createFor/createForUser';

const { updateUserForUserId } from '../updateFor/updateForUser';

const { deleteUserForUserId } from '../deleteFor/deleteForUser';

/*
Known:
- (if appliciable to controller) userId formatted correctly and request has sufficient permissions to use
*/

async function getUser(req: express.Request, res: express.Response) {
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

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createUser(req: express.Request, res: express.Response) {
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
      // userAppAccountToken,
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

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function updateUser(req: express.Request, res: express.Response) {
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

    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function deleteUser(req: express.Request, res: express.Response) {
  try {
    const { userId } = req.params;

    await deleteUserForUserId(
      req.databaseConnection,
      userId,
    );

    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

export {
  getUser, createUser, updateUser, deleteUser,
};
