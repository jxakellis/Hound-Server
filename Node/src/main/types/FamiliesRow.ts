// TODO FUTURE migrate from userId in families database to familyHeadUserId

const familiesColumns = `
f.userId,
f.familyId,
f.familyCode,
f.familyIsLocked,
f.familyAccountCreationDate
`;

type FamiliesRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userId: string
    familyId: string
    familyCode: string
    familyIsLocked: number
    familyAccountCreationDate: Date
};

export {
  type FamiliesRow,
  familiesColumns,
};
