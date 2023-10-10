import { FamiliesRow } from './FamiliesRow';
import { PreviousFamilyMembersRow } from './PreviousFamilyMembersRow';
import { TransactionsRow } from './TransactionsRow';
import { UserConfigurationRow } from './UserConfigurationRow';
import { PrivateUsersRow, PublicUsersRow } from './UsersRow';

type UserConfigurationRowWithNotificationToken = UserConfigurationRow & { userNotificationToken?: string }

type PrivateCombinedUsersInformationRow = PrivateUsersRow & UserConfigurationRow & { familyId?: string }

type CombinedFamilyInformationRow = FamiliesRow & {
    familyMembers: PublicUsersRow[]
    previousFamilyMembers: PreviousFamilyMembersRow[]
    familyActiveSubscription: TransactionsRow
}

export {
  UserConfigurationRowWithNotificationToken,
  PrivateCombinedUsersInformationRow,
  CombinedFamilyInformationRow,
};
