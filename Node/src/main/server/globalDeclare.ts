import { type PoolConnection } from 'mysql2';
import { type TransactionsRow } from '../types/rows/TransactionsRow.js';
import type { StringKeyDictionary as HoundDictionary } from '../types/StringKeyDictionary.js';

declare global {
    interface Error {
        houndDeclarationCode?: string;
    }
}

declare module 'express-serve-static-core' {
    export interface Request {
        houndDeclarationExtendedProperties: {
            requestId?: number,
            databaseConnection?: PoolConnection,
            hasActiveDatabaseTransaction: boolean,
            familyActiveSubscription?: TransactionsRow,
            // ids that have been verified with correct permission
            validatedVariables: {
                // userId of the request that has been verified with correct permissions
                validatedUserId?: string
                // userIdentifier of the request that has been verified with correct permissions
                validatedUserIdentifier?: string
                // familyId of the request that has been verified with correct permissions
                validatedFamilyId?: string
                // Each element in validatedDogs has a validatedDogId which corresponds to an existing dog
                validatedDogs: { validatedDogId: number, validatedDogUUID: string, unvalidatedDogDictionary: (HoundDictionary | undefined) }[]
                // Each element in validatedLogs has a validatedDogId and validatedLogId which corresponds to an existing log
                validatedLogs: { validatedDogUUID: string, validatedLogId: number, validatedLogUUID: string, unvalidatedLogDictionary: (HoundDictionary | undefined) }[]
                // Each element in validatedReminders has a validatedDogId and validatedReminderId which corresponds to an existing reminder
                validatedReminders: { validatedDogUUID: string, validatedReminderId: number, validatedReminderUUID: string, unvalidatedReminderDictionary: (HoundDictionary | undefined) }[]
                // Each element in validatedTriggers has a validatedDogId and validatedTriggerId which corresponds to an existing reminder
                validatedTriggers: { validatedDogUUID: string, validatedTriggerId: number, validatedTriggerUUID: string, unvalidatedTriggerDictionary: (HoundDictionary | undefined) }[]
            },
            unvalidatedVariables: {
                unvalidatedDogsDictionary: HoundDictionary[]
                unvalidatedLogsDictionary: HoundDictionary[]
                unvalidatedRemindersDictionary: HoundDictionary[]
                unvalidatedTriggersDictionary: HoundDictionary[]
                unvalidatedSurveyFeedbackDictionary: HoundDictionary
            }
        }
    }

    export interface Response {
        houndDeclarationExtendedProperties: {
            responseId?: number;

            hasSentResponse: boolean;
            sendSuccessResponse(body: NonNullable<unknown>): Promise<void>;
            sendFailureResponse(error?: unknown): Promise<void>;
        }
    }
}

declare global {
    interface Array<T> {
        safeIndex(index: number): T | undefined;
    }
}

// eslint-disable-next-line no-extend-native
Array.prototype.safeIndex = function safeIndex<T>(index: number): T | undefined {
  return this[index];
};

export {};
