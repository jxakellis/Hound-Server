const prefix = 'fm.';

const familyMembersColumnsWithFMPrefix = `
fm.familyId,
fm.userId,
fm.familyMemberJoinDate
`;

const familyMembersColumnsWithoutPrefix = familyMembersColumnsWithFMPrefix.replace(prefix, '');

type FamilyMembersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    familyId: string
    userId: string
    familyMemberJoinDate: Date
};

export {
  FamilyMembersRow,
  familyMembersColumnsWithFMPrefix,
  familyMembersColumnsWithoutPrefix,
};
