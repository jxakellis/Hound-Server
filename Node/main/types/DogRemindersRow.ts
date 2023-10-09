const prefix = 'dr.';

const dogRemindersColumnsWithDRPrefix = `
dr.reminderId,
dr.reminderAction,
dr.reminderCustomActionName,
dr.reminderType,
dr.reminderIsEnabled,
dr.reminderExecutionBasis,
dr.reminderExecutionDate,
dr.reminderLastModified,
dr.reminderIsDeleted,
dr.snoozeExecutionInterval,
dr.countdownExecutionInterval,
dr.weeklyUTCHour,
dr.weeklyUTCMinute,
dr.weeklySunday,
dr.weeklyMonday,
dr.weeklyTuesday,
dr.weeklyWednesday,
dr.weeklyThursday,
dr.weeklyFriday,
dr.weeklySaturday,
dr.weeklySkippedDate,
dr.monthlyUTCDay,
dr.monthlyUTCHour,
dr.monthlyUTCMinute,
dr.monthlySkippedDate,
dr.oneTimeDate
`;

const dogRemindersColumnsWithoutPrefix = dogRemindersColumnsWithDRPrefix.replace(prefix, '');

type DogRemindersRow = {
    reminderId: number
    reminderAction: string
    reminderCustomActionName: string
    reminderType: string
    reminderIsEnabled: boolean
    reminderExecutionBasis: Date
    reminderExecutionDate?: Date
    reminderLastModified: Date
    reminderIsDeleted: boolean
    snoozeExecutionInterval?: number
    countdownExecutionInterval: number
    weeklyUTCHour: number
    weeklyUTCMinute: number
    weeklySunday: boolean
    weeklyMonday: boolean
    weeklyTuesday: boolean
    weeklyWednesday: boolean
    weeklyThursday: boolean
    weeklyFriday: boolean
    weeklySaturday: boolean
    weeklySkippedDate?: Date
    monthlyUTCDay: number
    monthlyUTCHour: number
    monthlyUTCMinute: number
    monthlySkippedDate?: Date
    oneTimeDate: Date
};

export {
  DogRemindersRow,
  dogRemindersColumnsWithDRPrefix,
  dogRemindersColumnsWithoutPrefix,
};
