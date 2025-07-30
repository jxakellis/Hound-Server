const dogRemindersColumns = `
dr.reminderId,
dr.reminderUUID,
dr.dogUUID,
dr.reminderActionTypeId,
dr.reminderCustomActionName,
dr.reminderType,
dr.reminderIsTriggerResult,
dr.reminderIsEnabled,
dr.reminderExecutionBasis,
dr.reminderExecutionDate,
dr.reminderTimeZone,
dr.reminderLastModified,
dr.reminderIsDeleted,
dr.snoozeExecutionInterval,
dr.countdownExecutionInterval,
dr.weeklyZonedHour,
dr.weeklyZonedMinute,
dr.weeklyZonedSunday,
dr.weeklyZonedMonday,
dr.weeklyZonedTuesday,
dr.weeklyZonedWednesday,
dr.weeklyZonedThursday,
dr.weeklyZonedFriday,
dr.weeklyZonedSaturday,
dr.weeklySkippedDate,
dr.weeklyZonedHour AS weeklyUTCHour,
dr.weeklyZonedMinute AS weeklyUTCMinute,
dr.weeklyZonedSunday AS weeklySunday,
dr.weeklyZonedMonday AS weeklyMonday,
dr.weeklyZonedTuesday AS weeklyTuesday,
dr.weeklyZonedWednesday AS weeklyWednesday,
dr.weeklyZonedThursday AS weeklyThursday,
dr.weeklyZonedFriday AS weeklyFriday,
dr.weeklyZonedSaturday AS weeklySaturday,
dr.monthlyZonedDay,
dr.monthlyZonedHour,
dr.monthlyZonedMinute,
dr.monthlySkippedDate,
dr.monthlyZonedDay AS monthlyUTCDay,
dr.monthlyZonedHour AS monthlyUTCHour,
dr.monthlyZonedMinute AS monthlyUTCMinute,
dr.oneTimeDate
`;

// TODO FUTURE DEPRECIATE <4.0.0 those AS casts above

type DogRemindersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reminderId: number
    reminderUUID: string
    dogUUID: string
    reminderActionTypeId: number
    reminderCustomActionName: string
    reminderType: string
    reminderIsTriggerResult: number
    reminderIsEnabled: number
    reminderExecutionBasis: Date
    reminderExecutionDate?: Date
    reminderTimeZone: string
    reminderLastModified: Date
    reminderIsDeleted: number
    snoozeExecutionInterval?: number
    countdownExecutionInterval: number
    weeklyZonedHour: number
    weeklyZonedMinute: number
    weeklyZonedSunday: number
    weeklyZonedMonday: number
    weeklyZonedTuesday: number
    weeklyZonedWednesday: number
    weeklyZonedThursday: number
    weeklyZonedFriday: number
    weeklyZonedSaturday: number
    weeklySkippedDate?: Date
    monthlyZonedDay: number
    monthlyZonedHour: number
    monthlyZonedMinute: number
    monthlySkippedDate?: Date
    oneTimeDate: Date
    reminderRecipientUserIds: string[]
};

type NotYetCreatedDogRemindersRow = Omit<DogRemindersRow, 'reminderId' | 'reminderIsDeleted' | 'reminderLastModified'>;
type NotYetUpdatedDogRemindersRow = Omit<DogRemindersRow, 'reminderIsDeleted' | 'reminderLastModified'>;

export {
  type DogRemindersRow,
  type NotYetCreatedDogRemindersRow,
  type NotYetUpdatedDogRemindersRow,
  dogRemindersColumns,
};
