import { FamiliesRow } from './FamiliesRow';
import { FamilyMembersRow } from './FamilyMembersRow';
import { PreviousFamilyMembersRow } from './PreviousFamilyMembersRow';
import { TransactionsRow } from './TransactionsRow';
import { UserConfigurationRow } from './UserConfigurationRow';
import { PrivateUsersRow, PublicUsersRow } from './UsersRow';

type UserConfigurationWithPartialPrivateUsers = UserConfigurationRow & Partial<PrivateUsersRow>

type PrivateCombinedUsersInformation = PrivateUsersRow & UserConfigurationRow & Partial<FamilyMembersRow>

type FamilyInformation = FamiliesRow & {
    familyMembers: PublicUsersRow[]
    previousFamilyMembers: PreviousFamilyMembersRow[]
    familyActiveSubscription: TransactionsRow
}

export {
  UserConfigurationWithPartialPrivateUsers,
  PrivateCombinedUsersInformation,
  FamilyInformation,
};
