const dogTriggersLogCustomActionNameReactionsColumns = `
dtlcanr.reactionId,
dtlcanr.triggerUUID,
dtlcanr.logCustomActionName
`;

type DogTriggersLogCustomActionNameReactionsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reactionId: number
    triggerUUID: string
    logCustomActionName: string
};

type NotYetCreatedDogTriggersLogCustomActionNameReactionsRow = Omit<DogTriggersLogCustomActionNameReactionsRow, 'reactionId'>;

export {
  type DogTriggersLogCustomActionNameReactionsRow,
  type NotYetCreatedDogTriggersLogCustomActionNameReactionsRow,
  dogTriggersLogCustomActionNameReactionsColumns,
};
