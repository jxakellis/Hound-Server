const userConfigurationColumns = `
uc.userConfigurationIsNotificationEnabled,
uc.userConfigurationIsLoudNotificationEnabled, 
uc.userConfigurationIsLogNotificationEnabled,
uc.userConfigurationInterfaceStyle,
uc.userConfigurationIsHapticsEnabled,
uc.userConfigurationUsesDeviceTimeZone,
uc.userConfigurationUserTimeZone,
uc.userConfigurationDeviceTimeZone,
uc.userConfigurationMeasurementSystem,
uc.userConfigurationSnoozeLength, 
uc.userConfigurationNotificationSound,
uc.userConfigurationIsReminderNotificationEnabled,
uc.userConfigurationIsSilentModeEnabled,
uc.userConfigurationSilentModeStartHour, 
uc.userConfigurationSilentModeEndHour,
uc.userConfigurationSilentModeStartMinute,
uc.userConfigurationSilentModeEndMinute,
uc.userConfigurationSilentModeStartHour AS userConfigurationSilentModeStartUTCHour,
uc.userConfigurationSilentModeEndHour AS userConfigurationSilentModeEndUTCHour,
uc.userConfigurationSilentModeStartMinute AS userConfigurationSilentModeStartUTCMinute,
uc.userConfigurationSilentModeEndMinute AS userConfigurationSilentModeEndUTCMinute
`;

type UserConfigurationRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userConfigurationIsNotificationEnabled: number
    userConfigurationIsLoudNotificationEnabled: number
    userConfigurationIsLogNotificationEnabled: number
    userConfigurationIsReminderNotificationEnabled: number
    userConfigurationInterfaceStyle: number
    userConfigurationIsHapticsEnabled: number
    userConfigurationUsesDeviceTimeZone: number
    userConfigurationUserTimeZone?: string
    userConfigurationDeviceTimeZone: string
    userConfigurationMeasurementSystem: number
    userConfigurationSnoozeLength: number
    userConfigurationNotificationSound: string
    userConfigurationIsSilentModeEnabled: number
    // TODO FUTURE DEPRECIATE any ref to UTCHour/Minute for silent mode <= 4.0.0
    userConfigurationSilentModeStartHour: number
    userConfigurationSilentModeEndHour: number
    userConfigurationSilentModeStartMinute: number
    userConfigurationSilentModeEndMinute: number
};

export {
  type UserConfigurationRow, userConfigurationColumns,
};
