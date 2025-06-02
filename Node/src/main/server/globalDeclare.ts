import { type PoolConnection } from 'mysql2';
import { type TransactionsRow } from '../types/rows/TransactionsRow.js';
import type { StringKeyDict as HoundDict } from '../types/StringKeyDict.js';

declare global {
    interface Error {
        houndDeclarationCode?: string;
    }
}

declare module 'express-serve-static-core' {
    export interface Request {
        houndProperties: {
            requestId?: number,
            databaseConnection?: PoolConnection,
            hasActiveDatabaseTransaction: boolean,
            familyActiveSubscription?: TransactionsRow,
            // ids that have been verified with correct permission
            validatedVars: {
                // userId of the request that has been verified with correct permissions
                validatedUserId?: string
                // userIdentifier of the request that has been verified with correct permissions
                validatedUserIdentifier?: string
                // familyId of the request that has been verified with correct permissions
                validatedFamilyId?: string
                // Each element in validatedDogs has a validatedDogId which corresponds to an existing dog
                validatedDogs: { validatedDogId: number, validatedDogUUID: string, unvalidatedDogDict: (HoundDict | undefined) }[]
                // Each element in validatedLogs has a validatedDogId and validatedLogId which corresponds to an existing log
                validatedLogs: { validatedDogUUID: string, validatedLogId: number, validatedLogUUID: string, unvalidatedLogDict: (HoundDict | undefined) }[]
                // Each element in validatedReminders has a validatedDogId and validatedReminderId which corresponds to an existing reminder
                validatedReminders: { validatedDogUUID: string, validatedReminderId: number, validatedReminderUUID: string, unvalidatedReminderDict: (HoundDict | undefined) }[]
                // Each element in validatedTriggers has a validatedDogId and validatedTriggerId which corresponds to an existing reminder
                validatedTriggers: { validatedDogUUID: string, validatedTriggerId: number, validatedTriggerUUID: string, unvalidatedTriggerDict: (HoundDict | undefined) }[]
            },
            unvalidatedVars: {
                unvalidatedDogsDict: HoundDict[]
                unvalidatedLogsDict: HoundDict[]
                unvalidatedRemindersDict: HoundDict[]
                unvalidatedTriggersDict: HoundDict[]
                unvalidatedSurveyFeedbackDict: HoundDict
            }
        }
    }

    export interface Response {
        houndProperties: {
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
