const dogTriggerLogReactionColumns = `
dtlr.reactionId,
dtlr.triggerUUID,
dtlr.logActionTypeId,
dtlr.logCustomActionName
`;

// TODO refactor this. we now bundle logCustomActionName and logCustomActionValue into a single column and remove DogTriggerLogCustomActionNameReactionRow

type DogTriggerLogReactionRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reactionId: number
    triggerUUID: string
    logActionTypeId: number
    logCustomActionName: string
};

type NotYetCreatedDogTriggerLogReactionRow = Omit<DogTriggerLogReactionRow, 'reactionId'>;

export {
  type DogTriggerLogReactionRow,
  type NotYetCreatedDogTriggerLogReactionRow,
  dogTriggerLogReactionColumns,
};
