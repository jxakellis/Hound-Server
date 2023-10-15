const prefix = 'pf.';

const previousFamiliesColumnsWithPFPrefix = `
pf.familyId,
pf.userId,
pf.familyCode,
pf.familyIsLocked,
pf.familyAccountCreationDate,
pf.familyAccountDeletionDate
`;

const previousFamiliesColumnsWithoutPrefix = previousFamiliesColumnsWithPFPrefix.replace(prefix, '');

type PreviousFamiliesRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    familyId: string
    userId: string
    familyCode: string
    familyIsLocked: number
    familyAccountCreationDate: Date
    familyAccountDeletionDate: Date
};

export {
  PreviousFamiliesRow,
  previousFamiliesColumnsWithPFPrefix,
  previousFamiliesColumnsWithoutPrefix,
};
