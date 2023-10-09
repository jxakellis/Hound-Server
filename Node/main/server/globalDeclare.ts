import { PoolConnection } from 'mysql2';

declare global {
    interface Error {
        code?: string;
    }
}

declare module 'express-serve-static-core' {
    export interface Request {
        databaseConnection?: PoolConnection
        hasActiveDatabaseTransaction: boolean;
        requestId?: number;
    }
    export interface Response {
      sendResponseForStatusBodyError(status: number, body?: { [key: string]: unknown }, error?: object): Promise<void>;
      hasSentResponse: boolean;
      responseId?: number;
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
