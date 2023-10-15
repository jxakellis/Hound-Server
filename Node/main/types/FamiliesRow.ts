const prefix = 'f.';

// TODO FUTURE migrate from userId in families database to familyHeadUserId

const prefixFamiliesColumns = `
f.userId,
f.familyId,
f.familyCode,
f.familyIsLocked,
f.familyAccountCreationDate
`;

const noPrefixFamiliesColumns = prefixFamiliesColumns.replace(prefix, '');

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
  prefixFamiliesColumns,
  noPrefixFamiliesColumns,
};
