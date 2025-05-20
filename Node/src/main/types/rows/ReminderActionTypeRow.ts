const reminderActionTypeColumns = `
rat.reminderActionTypeId,
rat.internalValue,
rat.readableValue,
rat.emoji,
rat.sortOrder,
rat.isDefault
`;

type ReminderActionTypeRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reminderActionTypeId: number
    internalValue: string
    readableValue: string
    emoji: string
    sortOrder: number
    isDefault: number
};

export {
  type ReminderActionTypeRow,
  reminderActionTypeColumns,
};
