const dogTriggerLogCustomActionNameReactionColumns = `
dtlcanr.reactionId,
dtlcanr.triggerUUID,
dtlcanr.logCustomActionName
`;

type DogTriggerLogCustomActionNameReactionRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reactionId: number
    triggerUUID: string
    logCustomActionName: string
};

type NotYetCreatedDogTriggerLogCustomActionNameReactionRow = Omit<DogTriggerLogCustomActionNameReactionRow, 'reactionId'>;

export {
  type DogTriggerLogCustomActionNameReactionRow,
  type NotYetCreatedDogTriggerLogCustomActionNameReactionRow,
  dogTriggerLogCustomActionNameReactionColumns,
};
