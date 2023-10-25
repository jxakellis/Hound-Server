// TODO FUTURE depreciate userId, last used <= 3.0.0

const familiesColumns = `
f.familyHeadUserId,
f.familyHeadUserId AS userId,
f.familyId,
f.familyCode,
f.familyIsLocked,
f.familyAccountCreationDate
`;

type FamiliesRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    familyHeadUserId: string
    familyId: string
    familyCode: string
    familyIsLocked: number
    familyAccountCreationDate: Date
};

export {
  type FamiliesRow,
  familiesColumns,
};
