import { type PoolConnection } from 'mysql2';
import { type TransactionsRow } from '../types/rows/TransactionsRow.js';
import type { StringKeyDict as HoundDict } from '../types/StringKeyDict.js';
import type { DogsRow } from '../types/rows/DogsRow.js';
import type { DogLogsRow } from '../types/rows/DogLogsRow.js';
import type { DogRemindersRow } from '../types/rows/DogRemindersRow.js';
import type { DogTriggersRow } from '../types/rows/DogTriggersRow.js';

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
            authenticated: {
                authUserId?: string
                authUserIdentifier?: string
                authFamilyId?: string
                authFamilyActiveSubscription?: TransactionsRow,
                authDogs: { authDog: DogsRow, unauthNewDogDict: (HoundDict | undefined) }[]
                authLogs: { authLog: DogLogsRow, unauthNewLogDict: (HoundDict | undefined) }[]
                authReminders: { authReminder: DogRemindersRow, unauthNewReminderDict: (HoundDict | undefined) }[]
                authTriggers: { authTrigger: DogTriggersRow, unauthNewTriggerDict: (HoundDict | undefined) }[]
            },
            unauthenticated: {
                unauthDogsDict: HoundDict[]
                unauthLogsDict: HoundDict[]
                unauthRemindersDict: HoundDict[]
                unauthTriggersDict: HoundDict[]
                unauthSurveyFeedbackDict: HoundDict
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
