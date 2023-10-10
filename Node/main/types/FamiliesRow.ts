const prefix = 'f.';

// TODO FUTURE migrate from userId in families database to familyHeadUserId

const familiesColumnsWithFPrefix = `
f.userId,
f.familyId,
f.familyCode,
f.familyIsLocked,
f.familyAccountCreationDate
`;

const familiesColumnsWithoutPrefix = familiesColumnsWithFPrefix.replace(prefix, '');

type FamiliesRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userId: string
    familyId: string
    familyCode: string
    familyIsLocked: number
    familyAccountCreationDate: Date
};

export {
  FamiliesRow,
  familiesColumnsWithFPrefix,
  familiesColumnsWithoutPrefix,
};
