import express from 'express';

import { getPrivateCombinedUsersInformation } from '../getFor/getForUser.js';
import { createUserForUserIdentifier } from '../createFor/createForUser.js';
import { updateUserForUserId } from '../updateFor/updateForUser.js';
import { deleteUserForUserId } from '../deleteFor/deleteForUser.js';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

import { formatNumber, formatUnknownString } from '../../main/format/formatObject.js';

/*
Known:
- (if appliciable to controller) userId formatted correctly and request has sufficient permissions to use
*/

async function getUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserIdentifier } = req.houndDeclarationExtendedProperties.validatedVariables;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserIdentifier === undefined || validatedUserIdentifier === null) {
      throw new HoundError('validatedUserIdentifier missing', getUser, ERROR_CODES.VALUE.INVALID);
    }

    const result = await getPrivateCombinedUsersInformation(databaseConnection, validatedUserIdentifier);

    if (result === undefined || result === null) {
      throw new HoundError('No user found or invalid permissions', getUser, ERROR_CODES.PERMISSION.NO.USER);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function createUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserIdentifier } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userEmail = formatUnknownString(req.body['userEmail']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userFirstName = formatUnknownString(req.body['userFirstName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userLastName = formatUnknownString(req.body['userLastName']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userNotificationToken = formatUnknownString(req.body['userNotificationToken']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsNotificationEnabled = formatNumber(req.body['userConfigurationIsNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsLoudNotificationEnabled = formatNumber(req.body['userConfigurationIsLoudNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsLogNotificationEnabled = formatNumber(req.body['userConfigurationIsLogNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsReminderNotificationEnabled = formatNumber(req.body['userConfigurationIsReminderNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationInterfaceStyle = formatNumber(req.body['userConfigurationInterfaceStyle']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSnoozeLength = formatNumber(req.body['userConfigurationSnoozeLength']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationNotificationSound = formatUnknownString(req.body['userConfigurationNotificationSound']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationLogsInterfaceScale = formatUnknownString(req.body['userConfigurationLogsInterfaceScale']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationRemindersInterfaceScale = formatUnknownString(req.body['userConfigurationRemindersInterfaceScale']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsSilentModeEnabled = formatNumber(req.body['userConfigurationIsSilentModeEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartUTCHour = formatNumber(req.body['userConfigurationSilentModeStartUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndUTCHour = formatNumber(req.body['userConfigurationSilentModeEndUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartUTCMinute = formatNumber(req.body['userConfigurationSilentModeStartUTCMinute']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndUTCMinute = formatNumber(req.body['userConfigurationSilentModeEndUTCMinute']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserIdentifier === undefined || validatedUserIdentifier === null) {
      throw new HoundError('validatedUserIdentifier missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsNotificationEnabled === undefined || userConfigurationIsNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsLoudNotificationEnabled === undefined || userConfigurationIsLoudNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsLoudNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsLogNotificationEnabled === undefined || userConfigurationIsLogNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsLogNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsReminderNotificationEnabled === undefined || userConfigurationIsReminderNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsReminderNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationInterfaceStyle === undefined || userConfigurationInterfaceStyle === null) {
      throw new HoundError('userConfigurationInterfaceStyle missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSnoozeLength === undefined || userConfigurationSnoozeLength === null) {
      throw new HoundError('userConfigurationSnoozeLength missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationNotificationSound === undefined || userConfigurationNotificationSound === null) {
      throw new HoundError('userConfigurationNotificationSound missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationLogsInterfaceScale === undefined || userConfigurationLogsInterfaceScale === null) {
      throw new HoundError('userConfigurationLogsInterfaceScale missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationRemindersInterfaceScale === undefined || userConfigurationRemindersInterfaceScale === null) {
      throw new HoundError('userConfigurationRemindersInterfaceScale missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsSilentModeEnabled === undefined || userConfigurationIsSilentModeEnabled === null) {
      throw new HoundError('userConfigurationIsSilentModeEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeStartUTCHour === undefined || userConfigurationSilentModeStartUTCHour === null) {
      throw new HoundError('userConfigurationSilentModeStartUTCHour missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeEndUTCHour === undefined || userConfigurationSilentModeEndUTCHour === null) {
      throw new HoundError('userConfigurationSilentModeEndUTCHour missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeStartUTCMinute === undefined || userConfigurationSilentModeStartUTCMinute === null) {
      throw new HoundError('userConfigurationSilentModeStartUTCMinute missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeEndUTCMinute === undefined || userConfigurationSilentModeEndUTCMinute === null) {
      throw new HoundError('userConfigurationSilentModeEndUTCMinute missing', createUser, ERROR_CODES.VALUE.INVALID);
    }

    const result = await createUserForUserIdentifier(
      databaseConnection,
      validatedUserIdentifier,
      {
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
      },
      userEmail,
      userFirstName,
      userLastName,
      userNotificationToken,
    );

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function updateUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userNotificationToken = formatUnknownString(req.body['userNotificationToken']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsNotificationEnabled = formatNumber(req.body['userConfigurationIsNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsLoudNotificationEnabled = formatNumber(req.body['userConfigurationIsLoudNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsLogNotificationEnabled = formatNumber(req.body['userConfigurationIsLogNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsReminderNotificationEnabled = formatNumber(req.body['userConfigurationIsReminderNotificationEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationInterfaceStyle = formatNumber(req.body['userConfigurationInterfaceStyle']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSnoozeLength = formatNumber(req.body['userConfigurationSnoozeLength']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationNotificationSound = formatUnknownString(req.body['userConfigurationNotificationSound']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationLogsInterfaceScale = formatUnknownString(req.body['userConfigurationLogsInterfaceScale']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationRemindersInterfaceScale = formatUnknownString(req.body['userConfigurationRemindersInterfaceScale']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsSilentModeEnabled = formatNumber(req.body['userConfigurationIsSilentModeEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartUTCHour = formatNumber(req.body['userConfigurationSilentModeStartUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndUTCHour = formatNumber(req.body['userConfigurationSilentModeEndUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartUTCMinute = formatNumber(req.body['userConfigurationSilentModeStartUTCMinute']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndUTCMinute = formatNumber(req.body['userConfigurationSilentModeEndUTCMinute']);

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', updateUser, ERROR_CODES.VALUE.INVALID);
    }

    await updateUserForUserId(
      databaseConnection,
      validatedUserId,
      {
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
      },
      userNotificationToken,
    );

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

async function deleteUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    const { validatedUserId } = req.houndDeclarationExtendedProperties.validatedVariables;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined || validatedUserId === null) {
      throw new HoundError('validatedUserId missing', deleteUser, ERROR_CODES.VALUE.INVALID);
    }

    await deleteUserForUserId(
      databaseConnection,
      validatedUserId,
    );

    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getUser, createUser, updateUser, deleteUser,
};
