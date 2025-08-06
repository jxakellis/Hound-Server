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
dr.reminderCreated,
dr.reminderCreatedBy,
dr.reminderLastModified,
dr.reminderLastModifiedBy,
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
dr.monthlyZonedDay,
dr.monthlyZonedHour,
dr.monthlyZonedMinute,
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
    reminderIsTriggerResult: number
    reminderIsEnabled: number
    reminderExecutionBasis: Date
    reminderExecutionDate?: Date
    reminderTimeZone: string
    reminderCreated: Date
    reminderCreatedBy: string
    reminderLastModified?: Date
    reminderLastModifiedBy?: string
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
    // added w/ separate queries
    reminderRecipientUserIds: string[]
};

type NotYetCreatedDogRemindersRow = Omit<DogRemindersRow, 'reminderId' | 'reminderIsDeleted' | 'reminderCreated' | 'reminderLastModified' | 'reminderLastModifiedBy'>;
type NotYetUpdatedDogRemindersRow = Omit<DogRemindersRow, 'reminderIsDeleted' | 'reminderCreated' | 'reminderCreatedBy' | 'reminderLastModified'>;

export {
  type DogRemindersRow,
  type NotYetCreatedDogRemindersRow,
  type NotYetUpdatedDogRemindersRow,
  dogRemindersColumns,
};
