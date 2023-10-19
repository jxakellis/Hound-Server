// TODO FUTURE depreciate userApplicationUsername (last used in 3.0.0)
const privateUsersColumns = `
u.userId,
u.userAppAccountToken,
u.userAppAccountToken AS userApplicationUsername,
u.userEmail,
u.userFirstName,
u.userLastName,
u.userNotificationToken
`;

type PrivateUsersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userId: string
    userAppAccountToken: string
    userEmail?: string
    userFirstName?: string
    userLastName?: string
    userNotificationToken?: string
};

const publicUsersColumns = `
u.userId,
u.userFirstName,
u.userLastName
`;

type PublicUsersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    userId: string
    userFirstName?: string
    userLastName?: string
};

export {
  type PrivateUsersRow,
  privateUsersColumns,
  type PublicUsersRow,
  publicUsersColumns,
};
