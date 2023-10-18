import express from 'express';

import { getPrivateCombinedUsersInformation } from '../getFor/getForUser';
import { createUserForUserIdentifier } from '../createFor/createForUser';
import { updateUserForUserId } from '../updateFor/updateForUser';
import { deleteUserForUserId } from '../deleteFor/deleteForUser';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- (if appliciable to controller) userId formatted correctly and request has sufficient permissions to use
*/

async function getUser(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserIdentifier } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', 'getUser', ERROR_CODES.VALUE.INVALID));
    }
    if (validatedUserIdentifier === undefined) {
      throw new HoundError('validatedUserIdentifier missing', 'getUser', ERROR_CODES.VALUE.INVALID));
    }

    const result = await getPrivateCombinedUsersInformation(databaseConnection, validatedUserIdentifier);

    if (result === undefined) {
      throw new ValidationError('No user found or invalid permissions', ERROR_CODES.PERMISSION.NO.USER);
    }

    return res.extendedProperties.sendSuccessResponse(result, null);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createUser(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

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
      req.extendedProperties.databaseConnection,
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

    return res.extendedProperties.sendSuccessResponse(result, null);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function updateUser(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId } = req.extendedProperties.validatedVariables;
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
      req.extendedProperties.databaseConnection,
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

    return res.extendedProperties.sendSuccessResponse(undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function deleteUser(req: express.Request, res: express.Response) {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      throw new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    const { userId } = req.extendedProperties.validatedVariables;

    await deleteUserForUserId(
      req.extendedProperties.databaseConnection,
      userId,
    );

    return res.extendedProperties.sendSuccessResponse(undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getUser, createUser, updateUser, deleteUser,
};
