import express from 'express';

import { getPrivateCombinedUsersInformation } from '../../../get/getUser.js';
import { createUserForUserIdentifier } from '../../../create/createUser.js';
import { updateUserForUserId } from '../../../update/updateUser.js';
import { deleteUserForUserId } from '../../../delete/deleteUser.js';
import { ERROR_CODES, HoundError } from '../../../../main/server/globalErrors.js';

import { formatNumber, formatUnknownString } from '../../../../main/format/formatObject.js';

async function getUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserIdentifier } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getUser, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserIdentifier === undefined || authUserIdentifier === null) {
      throw new HoundError('authUserIdentifier missing', getUser, ERROR_CODES.VALUE.MISSING);
    }

    const result = await getPrivateCombinedUsersInformation(databaseConnection, authUserIdentifier);

    if (result === undefined || result === null) {
      throw new HoundError('No user found or invalid permissions', getUser, ERROR_CODES.PERMISSION.NO.USER);
    }

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function createUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserIdentifier } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserIdentifier === undefined || authUserIdentifier === null) {
      throw new HoundError('authUserIdentifier missing', createUser, ERROR_CODES.VALUE.MISSING);
    }

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
    const userConfigurationMeasurementSystem = formatNumber(req.body['userConfigurationMeasurementSystem']) ?? 2;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationInterfaceStyle = formatNumber(req.body['userConfigurationInterfaceStyle']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsHapticsEnabled = formatNumber(req.body['userConfigurationIsHapticsEnabled']) ?? 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationUsesDeviceTimeZone = formatNumber(req.body['userConfigurationUsesDeviceTimeZone']) ?? 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationUserTimeZone = formatUnknownString(req.body['userConfigurationUserTimeZone']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationDeviceTimeZone = formatUnknownString(req.body['userConfigurationDeviceTimeZone']) ?? 'UTC';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSnoozeLength = formatNumber(req.body['userConfigurationSnoozeLength']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationNotificationSound = formatUnknownString(req.body['userConfigurationNotificationSound']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsSilentModeEnabled = formatNumber(req.body['userConfigurationIsSilentModeEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartHour = formatNumber(req.body['userConfigurationSilentModeStartHour']) ?? formatNumber(req.body['userConfigurationSilentModeStartUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndHour = formatNumber(req.body['userConfigurationSilentModeEndHour']) ?? formatNumber(req.body['userConfigurationSilentModeEndUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartMinute = formatNumber(req.body['userConfigurationSilentModeStartMinute']) ?? formatNumber(req.body['userConfigurationSilentModeStartUTCMinute']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndMinute = formatNumber(req.body['userConfigurationSilentModeEndMinute']) ?? formatNumber(req.body['userConfigurationSilentModeEndUTCMinute']);

    if (userConfigurationIsNotificationEnabled === undefined || userConfigurationIsNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsNotificationEnabled missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationIsLoudNotificationEnabled === undefined || userConfigurationIsLoudNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsLoudNotificationEnabled missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationIsLogNotificationEnabled === undefined || userConfigurationIsLogNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsLogNotificationEnabled missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationIsReminderNotificationEnabled === undefined || userConfigurationIsReminderNotificationEnabled === null) {
      throw new HoundError('userConfigurationIsReminderNotificationEnabled missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationMeasurementSystem === undefined || userConfigurationMeasurementSystem === null) {
      throw new HoundError('userConfigurationMeasurementSystem missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationInterfaceStyle === undefined || userConfigurationInterfaceStyle === null) {
      throw new HoundError('userConfigurationInterfaceStyle missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationIsHapticsEnabled === undefined || userConfigurationIsHapticsEnabled === null) {
      throw new HoundError('userConfigurationIsHapticsEnabled missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationUsesDeviceTimeZone === undefined || userConfigurationUsesDeviceTimeZone === null) {
      throw new HoundError('userConfigurationUsesDeviceTimeZone missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    // userConfigurationUserTimeZone is optional
    if (userConfigurationDeviceTimeZone === undefined || userConfigurationDeviceTimeZone === null) {
      throw new HoundError('userConfigurationDeviceTimeZone missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationSnoozeLength === undefined || userConfigurationSnoozeLength === null) {
      throw new HoundError('userConfigurationSnoozeLength missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationNotificationSound === undefined || userConfigurationNotificationSound === null) {
      throw new HoundError('userConfigurationNotificationSound missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationIsSilentModeEnabled === undefined || userConfigurationIsSilentModeEnabled === null) {
      throw new HoundError('userConfigurationIsSilentModeEnabled missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationSilentModeStartHour === undefined || userConfigurationSilentModeStartHour === null) {
      throw new HoundError('userConfigurationSilentModeStartHour missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationSilentModeEndHour === undefined || userConfigurationSilentModeEndHour === null) {
      throw new HoundError('userConfigurationSilentModeEndHour missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationSilentModeStartMinute === undefined || userConfigurationSilentModeStartMinute === null) {
      throw new HoundError('userConfigurationSilentModeStartMinute missing', createUser, ERROR_CODES.VALUE.MISSING);
    }
    if (userConfigurationSilentModeEndMinute === undefined || userConfigurationSilentModeEndMinute === null) {
      throw new HoundError('userConfigurationSilentModeEndMinute missing', createUser, ERROR_CODES.VALUE.MISSING);
    }

    const result = await createUserForUserIdentifier(
      databaseConnection,
      authUserIdentifier,
      {
        userConfigurationIsNotificationEnabled,
        userConfigurationIsLoudNotificationEnabled,
        userConfigurationIsLogNotificationEnabled,
        userConfigurationIsReminderNotificationEnabled,
        userConfigurationMeasurementSystem,
        userConfigurationInterfaceStyle,
        userConfigurationIsHapticsEnabled,
        userConfigurationUsesDeviceTimeZone,
        userConfigurationUserTimeZone,
        userConfigurationDeviceTimeZone,
        userConfigurationSnoozeLength,
        userConfigurationNotificationSound,
        userConfigurationIsSilentModeEnabled,
        userConfigurationSilentModeStartHour,
        userConfigurationSilentModeEndHour,
        userConfigurationSilentModeStartMinute,
        userConfigurationSilentModeEndMinute,
      },
      userEmail,
      userFirstName,
      userLastName,
      userNotificationToken,
    );

    return res.houndProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function updateUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', updateUser, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', updateUser, ERROR_CODES.PERMISSION.NO.USER);
    }

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
    const userConfigurationMeasurementSystem = formatNumber(req.body['userConfigurationMeasurementSystem']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationInterfaceStyle = formatNumber(req.body['userConfigurationInterfaceStyle']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsHapticsEnabled = formatNumber(req.body['userConfigurationIsHapticsEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationUsesDeviceTimeZone = formatNumber(req.body['userConfigurationUsesDeviceTimeZone']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationUserTimeZone = formatUnknownString(req.body['userConfigurationUserTimeZone']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationDeviceTimeZone = formatUnknownString(req.body['userConfigurationDeviceTimeZone']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSnoozeLength = formatNumber(req.body['userConfigurationSnoozeLength']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationNotificationSound = formatUnknownString(req.body['userConfigurationNotificationSound']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationIsSilentModeEnabled = formatNumber(req.body['userConfigurationIsSilentModeEnabled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartHour = formatNumber(req.body['userConfigurationSilentModeStartHour']) ?? formatNumber(req.body['userConfigurationSilentModeStartUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndHour = formatNumber(req.body['userConfigurationSilentModeEndHour']) ?? formatNumber(req.body['userConfigurationSilentModeEndUTCHour']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeStartMinute = formatNumber(req.body['userConfigurationSilentModeStartMinute']) ?? formatNumber(req.body['userConfigurationSilentModeStartUTCMinute']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userConfigurationSilentModeEndMinute = formatNumber(req.body['userConfigurationSilentModeEndMinute']) ?? formatNumber(req.body['userConfigurationSilentModeEndUTCMinute']);

    await updateUserForUserId(
      databaseConnection,
      authUserId,
      {
        userConfigurationIsNotificationEnabled,
        userConfigurationIsLoudNotificationEnabled,
        userConfigurationIsLogNotificationEnabled,
        userConfigurationIsReminderNotificationEnabled,
        userConfigurationMeasurementSystem,
        userConfigurationInterfaceStyle,
        userConfigurationIsHapticsEnabled,
        userConfigurationUsesDeviceTimeZone,
        userConfigurationUserTimeZone,
        userConfigurationDeviceTimeZone,
        userConfigurationSnoozeLength,
        userConfigurationNotificationSound,
        userConfigurationIsSilentModeEnabled,
        userConfigurationSilentModeStartHour,
        userConfigurationSilentModeEndHour,
        userConfigurationSilentModeStartMinute,
        userConfigurationSilentModeEndMinute,
      },
      userNotificationToken,
    );

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

async function deleteUser(req: express.Request, res: express.Response): Promise<void> {
  try {
    // Confirm that databaseConnection and validatedIds are defined and non-null first.
    // Before diving into any specifics of this function, we want to confirm the very basics 1. connection to database 2. permissions to do functionality
    const { databaseConnection } = req.houndProperties;
    const { authUserId } = req.houndProperties.authenticated;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', deleteUser, ERROR_CODES.VALUE.MISSING);
    }
    if (authUserId === undefined || authUserId === null) {
      throw new HoundError('No user found or invalid permissions', deleteUser, ERROR_CODES.PERMISSION.NO.USER);
    }

    await deleteUserForUserId(
      databaseConnection,
      authUserId,
    );

    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getUser, createUser, updateUser, deleteUser,
};
