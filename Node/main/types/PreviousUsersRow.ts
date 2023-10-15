const prefix = 'pu.';

const prefixPreviousUsersColumns = `
pu.userId,
pu.userIdentifier,
pu.userApplicationUsername,
pu.userEmail,
pu.userFirstName,
pu.userLastName,
pu.userNotificationToken,
pu.userAccountCreationDate,
pu.userAccountDeletionDate
`;

const noPrefixPreviousUsersColumns = prefixPreviousUsersColumns.replace(prefix, '');

type PreviousUsersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userId: string
    userIdentifier: string
    userApplicationUsername: string
    userEmail?: string
    userFirstName?: string
    userLastName?: string
    userNotificationToken?: string
    userAccountCreationDate: string
    userAccountDeletionDate: string
};

export {
  PreviousUsersRow,
  prefixPreviousUsersColumns,
  noPrefixPreviousUsersColumns,
};
