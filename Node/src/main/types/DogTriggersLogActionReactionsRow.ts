const dogTriggersLogActionReactionsColumns = `
dtlar.reactionId,
dtlar.triggerUUID,
dtlar.logActionTypeId
`;

type DogTriggersLogActionReactionsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reactionId: number
    triggerUUID: string
    logActionTypeId: number
};

type NotYetCreatedDogTriggersLogActionReactionsRow = Omit<DogTriggersLogActionReactionsRow, 'reactionId'>;

export {
  type DogTriggersLogActionReactionsRow,
  type NotYetCreatedDogTriggersLogActionReactionsRow,
  dogTriggersLogActionReactionsColumns,
};
