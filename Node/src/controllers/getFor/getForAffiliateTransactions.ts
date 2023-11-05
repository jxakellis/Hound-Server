/*
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';

async function getAffiliateTransactionsForOfferIdentifier(databaseConnection: Queryable, offerIdentifier: string): Promise<void> {
/*
For each userId in transactions, find the oldest purchase date transaction for each userId. (that will grab either the free trial or offer identifier transaction)

For those results, find the transactions where offer identifier matches (eliminate free trials, so offer identifier transactions for each userId)
    - FULFILLS: If a user has already purchased a Hound subscription previously, you are not eligible for an affiliate reward.
    - FULFILLS: If they have used another code or free trial, you are not eligible for an affiliate reward.

For those results, find the current familyId of each of those userIds (currentFamilyId)
Additionally, for each userId, find the oldest entry in previousFamilyMembers where userId matches (oldFamilyId)

For those results, find users where oldFamilyId is null (never been in a different family) or oldFamilyId isn't null but == currentFamilyId
    - FULFILLS: If they have been a part of another family before, you are not eligible for an affiliate reward.
*/
/*
}

export {
  getAffiliateTransactionsForOfferIdentifier,
};
*/
