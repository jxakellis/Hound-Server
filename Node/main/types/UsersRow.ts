// TODO FUTURE depreciate userApplicationUsername (last used in 3.0.0)
const prefix = 'u.';

const privateUsersColumnsWithUPrefix = `
u.userId,
u.userAppAccountToken,
u.userAppAccountToken AS userApplicationUsername,
u.userEmail,
u.userFirstName,
u.userLastName,
u.userNotificationToken
`;

const privateUsersColumnsWithoutPrefix = privateUsersColumnsWithUPrefix.replace(prefix, '');

type PrivateUsersRow = {
    userId: string
    userAppAccountToken: string
    userEmail?: string
    userFirstName?: string
    userLastName?: string
    userNotificationToken?: string
};

const publicUsersColumnsWithUPrefix = `
u.userId,
u.userFirstName,
u.userLastName
`;

const publicUsersColumnsWithoutPrefix = publicUsersColumnsWithUPrefix.replace(prefix, '');

type PublicUsersRow = {
    userId: string
    userFirstName?: string
    userLastName?: string
};

export {
  PrivateUsersRow,
  privateUsersColumnsWithUPrefix,
  privateUsersColumnsWithoutPrefix,
  PublicUsersRow,
  publicUsersColumnsWithUPrefix,
  publicUsersColumnsWithoutPrefix,
};
