import { type FamiliesRow } from './FamiliesRow.js';
import { type FamilyMembersRow } from './FamilyMembersRow.js';
import { type PreviousFamilyMembersRow } from './PreviousFamilyMembersRow.js';
import { type TransactionsRow } from './TransactionsRow.js';
import { type UserConfigurationRow } from './UserConfigurationRow.js';
import { type PrivateUsersRow, type PublicUsersRow } from './UsersRow.js';

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
