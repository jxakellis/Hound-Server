const dogTriggerReminderResultColumns = `
dtrr.reactionId,
dtrr.triggerUUID,
dtrr.logActionTypeId,
dtrr.logCustomActionName
`;

type DogTriggerReminderResultRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reactionId: number
    triggerUUID: string
    reminderActionTypeId: number
    reminderCustomActionName: string
};

type NotYetCreatedDogTriggerReminderResultRow = Omit<DogTriggerReminderResultRow, 'reactionId'>;

export {
  type DogTriggerReminderResultRow,
  type NotYetCreatedDogTriggerReminderResultRow,
  dogTriggerReminderResultColumns,
};
