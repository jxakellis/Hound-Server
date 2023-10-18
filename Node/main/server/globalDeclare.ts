import { PoolConnection } from 'mysql2';
import { TransactionsRow } from '../types/TransactionsRow';

declare global {
    interface Error {
        code?: string;
    }
}

declare module 'express-serve-static-core' {
    // TODO NOW add a component to request that stores all of our validated information
    export interface Request {
        extendedProperties: {
            requestId?: number;

            databaseConnection?: PoolConnection
            hasActiveDatabaseTransaction: boolean;

            familyActiveSubscription?: TransactionsRow

            // TODO NOW for all routes, except inside validateIds.ts, use req.validatedVariables.someId isntead of req.params
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
        extendedProperties: {
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
