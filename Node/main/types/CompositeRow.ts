import { UserConfigurationRow } from './UserConfigurationRow';
import { PrivateUsersRow } from './UsersRow';

type UserConfigurationRowWithNotificationToken = UserConfigurationRow & { userNotificationToken?: string }

type PrivateCombinedUsersInformationRow = PrivateUsersRow & UserConfigurationRow & { familyId?: string }

export {
  UserConfigurationRowWithNotificationToken,
  PrivateCombinedUsersInformationRow,
};
