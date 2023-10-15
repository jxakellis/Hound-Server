const prefix = 'pfm.';

const prefixPreviousFamilyMembersColumns = `
pfm.familyId,
pfm.userId,
pfm.familyMemberJoinDate,
pfm.userFirstName,
pfm.userLastName,
pfm.familyMemberLeaveDate,
pfm.familyMemberLeaveReason
`;

const noPrefixPreviousFamilyMembersColumns = prefixPreviousFamilyMembersColumns.replace(prefix, '');

type PreviousFamilyMembersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    familyId: string
    userId: string
    familyMemberJoinDate: Date
    userFirstName?: string
    userLastName?: string
    familyMemberLeaveDate: Date
    familyMemberLeaveReason: string
};

export {
  PreviousFamilyMembersRow,
  prefixPreviousFamilyMembersColumns,
  noPrefixPreviousFamilyMembersColumns,
};
