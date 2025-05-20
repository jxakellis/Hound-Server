const dogRemindersColumns = `
dr.reminderId,
dr.reminderUUID,
dr.dogUUID,
dr.reminderActionTypeId,
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

type DogRemindersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reminderId: number
    reminderUUID: string
    dogUUID: string
    reminderActionTypeId: number
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

type NotYetCreatedDogRemindersRow = Omit<DogRemindersRow, 'reminderId' | 'reminderIsDeleted' | 'reminderLastModified'>;
type NotYetUpdatedDogRemindersRow = Omit<DogRemindersRow, 'reminderIsDeleted' | 'reminderLastModified'>;

export {
  type DogRemindersRow,
  type NotYetCreatedDogRemindersRow,
  type NotYetUpdatedDogRemindersRow,
  dogRemindersColumns,
};
