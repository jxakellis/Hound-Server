import { type PoolConnection } from 'mysql2';
import { type TransactionsRow } from '../types/TransactionsRow.js';

declare global {
    interface Error {
        houndDeclarationCode?: string;
    }
}

declare module 'express-serve-static-core' {
    export interface Request {
        houndDeclarationExtendedProperties: {
            requestId?: number;

            databaseConnection?: PoolConnection
            hasActiveDatabaseTransaction: boolean;

            familyActiveSubscription?: TransactionsRow

            // ids that have been verified with correct permission
            validatedVariables: {
                // userId of the request that has been verified with correct permissions
                validatedUserId?: string
                // userIdentifier of the request that has been verified with correct permissions
                validatedUserIdentifier?: string
                // familyId of the request that has been verified with correct permissions
                validatedFamilyId?: string
                // dogId of the request that has been verified with correct permissions
                validatedDogId?: number
                // logId of the request that has been verified with correct permissions
                validatedLogId?: number
                // reminderIds of the request that have been verified with correct permissions
                validatedReminderIds: number[]
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
