import express from 'express';

import { getPrivateCombinedUsersInformation } from '../getFor/getForUser';
import { createUserForUserIdentifier } from '../createFor/createForUser';
import { updateUserForUserId } from '../updateFor/updateForUser';
import { deleteUserForUserId } from '../deleteFor/deleteForUser';
import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatNumber, formatUnknownString } from '../../main/format/formatObject';

/*
Known:
- (if appliciable to controller) userId formatted correctly and request has sufficient permissions to use
*/

async function getUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserIdentifier } = req.extendedProperties.validatedVariables;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserIdentifier === undefined) {
      throw new HoundError('validatedUserIdentifier missing', getUser, ERROR_CODES.VALUE.INVALID);
    }

    const result = await getPrivateCombinedUsersInformation(databaseConnection, validatedUserIdentifier);

    if (result === undefined) {
      throw new HoundError('No user found or invalid permissions', getUser, ERROR_CODES.PERMISSION.NO.USER);
    }

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function createUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserIdentifier } = req.extendedProperties.validatedVariables;
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

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserIdentifier === undefined) {
      throw new HoundError('validatedUserIdentifier missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsNotificationEnabled === undefined) {
      throw new HoundError('userConfigurationIsNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsLoudNotificationEnabled === undefined) {
      throw new HoundError('userConfigurationIsLoudNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsLogNotificationEnabled === undefined) {
      throw new HoundError('userConfigurationIsLogNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsReminderNotificationEnabled === undefined) {
      throw new HoundError('userConfigurationIsReminderNotificationEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationInterfaceStyle === undefined) {
      throw new HoundError('userConfigurationInterfaceStyle missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSnoozeLength === undefined) {
      throw new HoundError('userConfigurationSnoozeLength missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationNotificationSound === undefined) {
      throw new HoundError('userConfigurationNotificationSound missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationLogsInterfaceScale === undefined) {
      throw new HoundError('userConfigurationLogsInterfaceScale missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationRemindersInterfaceScale === undefined) {
      throw new HoundError('userConfigurationRemindersInterfaceScale missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationIsSilentModeEnabled === undefined) {
      throw new HoundError('userConfigurationIsSilentModeEnabled missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeStartUTCHour === undefined) {
      throw new HoundError('userConfigurationSilentModeStartUTCHour missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeEndUTCHour === undefined) {
      throw new HoundError('userConfigurationSilentModeEndUTCHour missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeStartUTCMinute === undefined) {
      throw new HoundError('userConfigurationSilentModeStartUTCMinute missing', createUser, ERROR_CODES.VALUE.INVALID);
    }
    if (userConfigurationSilentModeEndUTCMinute === undefined) {
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

    return res.extendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function updateUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId } = req.extendedProperties.validatedVariables;
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

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', updateUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
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

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

async function deleteUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedUserId } = req.extendedProperties.validatedVariables;
    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', deleteUser, ERROR_CODES.VALUE.INVALID);
    }
    if (validatedUserId === undefined) {
      throw new HoundError('validatedUserId missing', deleteUser, ERROR_CODES.VALUE.INVALID);
    }

    await deleteUserForUserId(
      databaseConnection,
      validatedUserId,
    );

    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getUser, createUser, updateUser, deleteUser,
};
