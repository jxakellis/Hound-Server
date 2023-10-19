import { type FamiliesRow } from './FamiliesRow';
import { type FamilyMembersRow } from './FamilyMembersRow';
import { type PreviousFamilyMembersRow } from './PreviousFamilyMembersRow';
import { type TransactionsRow } from './TransactionsRow';
import { type UserConfigurationRow } from './UserConfigurationRow';
import { type PrivateUsersRow, type PublicUsersRow } from './UsersRow';

type UserConfigurationWithPartialPrivateUsers = UserConfigurationRow & Partial<PrivateUsersRow>

type PrivateCombinedUsersInformation = PrivateUsersRow & UserConfigurationRow & Partial<FamilyMembersRow>

type FamilyInformation = FamiliesRow & {
    familyMembers: PublicUsersRow[]
    previousFamilyMembers: PreviousFamilyMembersRow[]
    familyActiveSubscription: TransactionsRow
}

export {
  type UserConfigurationWithPartialPrivateUsers,
  type PrivateCombinedUsersInformation,
  type FamilyInformation,
};
