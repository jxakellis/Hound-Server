const dogTriggerLogActionReactionColumns = `
dtlar.reactionId,
dtlar.triggerUUID,
dtlar.logActionTypeId
`;

type DogTriggerLogActionReactionRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    reactionId: number
    triggerUUID: string
    logActionTypeId: number
};

type NotYetCreatedDogTriggerLogActionReactionRow = Omit<DogTriggerLogActionReactionRow, 'reactionId'>;

export {
  type DogTriggerLogActionReactionRow,
  type NotYetCreatedDogTriggerLogActionReactionRow,
  dogTriggerLogActionReactionColumns,
};
