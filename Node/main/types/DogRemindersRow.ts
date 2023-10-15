const prefix = 'dr.';

const prefixDogRemindersColumns = `
dr.reminderId,
dr.dogId,
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

const noPrefixDogRemindersColumns = prefixDogRemindersColumns.replace(prefix, '');

type DogRemindersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reminderId: number
    dogId: number
    reminderAction: string
    reminderCustomActionName: string
    reminderType: string
    reminderIsEnabled: number
    reminderExecutionBasis: Date
    reminderExecutionDate?: Date
    reminderLastModified: Date
    reminderIsDeleted: number
    snoozeExecutionInterval?: number
    countdownExecutionInterval: number
    weeklyUTCHour: number
    weeklyUTCMinute: number
    weeklySunday: number
    weeklyMonday: number
    weeklyTuesday: number
    weeklyWednesday: number
    weeklyThursday: number
    weeklyFriday: number
    weeklySaturday: number
    weeklySkippedDate?: Date
    monthlyUTCDay: number
    monthlyUTCHour: number
    monthlyUTCMinute: number
    monthlySkippedDate?: Date
    oneTimeDate: Date
};

export {
  DogRemindersRow,
  prefixDogRemindersColumns,
  noPrefixDogRemindersColumns,
};
