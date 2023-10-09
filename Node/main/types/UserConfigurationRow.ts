const prefix = 'uc.';

const userConfigurationColumnsWithUCPrefix = `
uc.userId,
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

const userConfigurationColumnsWithoutPrefix = userConfigurationColumnsWithUCPrefix.replace(prefix, '');

type UserConfigurationRow = {
    userId: string
    userConfigurationIsNotificationEnabled: boolean
    userConfigurationIsLoudNotificationEnabled: boolean
    userConfigurationIsLogNotificationEnabled: boolean
    userConfigurationIsReminderNotificationEnabled: boolean
    userConfigurationInterfaceStyle: number
    userConfigurationSnoozeLength: number
    userConfigurationNotificationSound: string
    userConfigurationLogsInterfaceScale: string
    userConfigurationRemindersInterfaceScale: string
    userConfigurationPreviousDogManagerSynchronization: Date
    userConfigurationIsSilentModeEnabled: boolean
    userConfigurationSilentModeStartUTCHour: number
    userConfigurationSilentModeEndUTCHour: number
    userConfigurationSilentModeStartUTCMinute: number
    userConfigurationSilentModeEndUTCMinute: number
};

export {
  UserConfigurationRow, userConfigurationColumnsWithUCPrefix, userConfigurationColumnsWithoutPrefix,
};
