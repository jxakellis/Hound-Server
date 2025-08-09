const dogTriggerActivationColumns = `
dta.activationId,
dta.triggerUUID,
dta.activationDate
`;

type DogTriggerActivationRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    activationId: number
    triggerUUID: string
    activationDate: Date
};

type NotYetCreatedDogTriggerActivationRow = Omit<DogTriggerActivationRow, 'activationId'>;

export {
  type DogTriggerActivationRow,
  type NotYetCreatedDogTriggerActivationRow,
  dogTriggerActivationColumns,
};
