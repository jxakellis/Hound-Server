const dogTriggersColumns = `
dt.triggerId,
dt.triggerUUID,
dt.dogUUID,
dt.triggerCustomName,
dt.triggerType,
dt.triggerTimeDelay,
dt.triggerFixedTimeType,
dt.triggerFixedTimeTypeAmount,
dt.triggerFixedTimeUTCHour,
dt.triggerFixedTimeUTCMinute,
dt.triggerLastModified,
dt.triggerIsDeleted
`;

type DogTriggersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    triggerId: number
    triggerUUID: string
    dogUUID: string
    triggerCustomName: string
    reactionLogActionTypeIds: number[]
    reactionLogCustomActionNames: string[]
    resultReminderActionTypeId: number
    triggerType: string
    triggerTimeDelay: number
    triggerFixedTimeType: string
    triggerFixedTimeTypeAmount: number
    triggerFixedTimeUTCHour: number
    triggerFixedTimeUTCMinute: number
    triggerLastModified: Date
    triggerIsDeleted: number
};

type NotYetCreatedDogTriggersRow = Omit<DogTriggersRow, 'triggerId' | 'triggerIsDeleted' | 'triggerLastModified'>;
type NotYetUpdatedDogTriggersRow = Omit<DogTriggersRow, 'triggerIsDeleted' | 'triggerLastModified'>;

export {
  type DogTriggersRow,
  type NotYetCreatedDogTriggersRow,
  type NotYetUpdatedDogTriggersRow,
  dogTriggersColumns,
};
