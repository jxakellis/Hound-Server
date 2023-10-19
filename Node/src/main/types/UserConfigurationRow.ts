const userConfigurationColumns = `
uc.userConfigurationIsNotificationEnabled,
uc.userConfigurationIsLoudNotificationEnabled, 
uc.userConfigurationIsLogNotificationEnabled,
uc.userConfigurationInterfaceStyle,
uc.userConfigurationSnoozeLength, 
uc.userConfigurationNotificationSound,
uc.userConfigurationLogsInterfaceScale,
uc.userConfigurationRemindersInterfaceScale, 
uc.userConfigurationIsReminderNotificationEnabled,
uc.userConfigurationIsSilentModeEnabled,
uc.userConfigurationSilentModeStartUTCHour, 
uc.userConfigurationSilentModeEndUTCHour,
uc.userConfigurationSilentModeStartUTCMinute,
uc.userConfigurationSilentModeEndUTCMinute
`;

type UserConfigurationRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userConfigurationIsNotificationEnabled: number
    userConfigurationIsLoudNotificationEnabled: number
    userConfigurationIsLogNotificationEnabled: number
    userConfigurationIsReminderNotificationEnabled: number
    userConfigurationInterfaceStyle: number
    userConfigurationSnoozeLength: number
    userConfigurationNotificationSound: string
    userConfigurationLogsInterfaceScale: string
    userConfigurationRemindersInterfaceScale: string
    userConfigurationIsSilentModeEnabled: number
    userConfigurationSilentModeStartUTCHour: number
    userConfigurationSilentModeEndUTCHour: number
    userConfigurationSilentModeStartUTCMinute: number
    userConfigurationSilentModeEndUTCMinute: number
}; 

export {
  type UserConfigurationRow, userConfigurationColumns,
};
