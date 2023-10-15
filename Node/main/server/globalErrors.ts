const ERROR_CODES = {
  GENERAL: {
    APP_VERSION_OUTDATED: 'ER_GENERAL_APP_VERSION_OUTDATED',
    ENVIRONMENT_INVALID: 'ER_GENERAL_ENVIRONMENT_INVALID',
    PARSE_FORM_DATA_FAILED: 'ER_GENERAL_PARSE_FORM_DATA_FAILED',
    PARSE_JSON_FAILED: 'ER_GENERAL_PARSE_JSON_FAILED',
    POOL_CONNECTION_FAILED: 'ER_GENERAL_POOL_CONNECTION_FAILED',
    POOL_TRANSACTION_FAILED: 'ER_GENERAL_POOL_TRANSACTION_FAILED',
    APPLE_SERVER_FAILED: 'ER_GENERAL_APPLE_SERVER_FAILED',
    APPLE_SIGNEDPAYLOAD_NO_KEY_MATCH: 'ER_GENERAL_APPLE_NO_KEY_MATCH',
  },
  VALUE: {
    MISSING: 'ER_VALUE_MISSING',
    INVALID: 'ER_VALUE_INVALID',
  },
  PERMISSION: {
    NO: {
      USER: 'ER_PERMISSION_NO_USER',
      FAMILY: 'ER_PERMISSION_NO_FAMILY',
      DOG: 'ER_PERMISSION_NO_DOG',
      LOG: 'ER_PERMISSION_NO_LOG',
      REMINDER: 'ER_PERMISSION_NO_REMINDER',
    },
    INVALID: {
      FAMILY: 'ER_PERMISSION_INVALID_FAMILY',
    },
  },
  FAMILY: {
    LIMIT: {
      FAMILY_MEMBER_TOO_LOW: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_TOO_LOW',
      DOG_TOO_LOW: 'ER_FAMILY_LIMIT_DOG_TOO_LOW',
      LOG_TOO_LOW: 'ER_FAMILY_LIMIT_LOG_TOO_LOW',
      REMINDER_TOO_LOW: 'ER_FAMILY_LIMIT_REMINDER_TOO_LOW',
      FAMILY_MEMBER_EXCEEDED: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_EXCEEDED',
    },
    DELETED: {
      DOG: 'ER_FAMILY_DELETED_DOG',
      LOG: 'ER_FAMILY_DELETED_LOG',
      REMINDER: 'ER_FAMILY_DELETED_REMINDER',
    },
    JOIN: {
      FAMILY_CODE_INVALID: 'ER_FAMILY_JOIN_FAMILY_CODE_INVALID',
      FAMILY_LOCKED: 'ER_FAMILY_JOIN_FAMILY_LOCKED',
      IN_FAMILY_ALREADY: 'ER_FAMILY_JOIN_IN_FAMILY_ALREADY',
    },
    LEAVE: {
      SUBSCRIPTION_ACTIVE: 'ER_FAMILY_LEAVE_SUBSCRIPTION_ACTIVE',
      STILL_FAMILY_MEMBERS: 'ER_FAMILY_LEAVE_STILL_FAMILY_MEMBERS',
    },
  },
};

class HoundError extends Error {
  constructor(message: string, name: string, code?: string, fromError?: unknown) {
    super(message);
    this.code = code;
    this.message = message;
    this.name = name;

    if (fromError !== undefined && fromError instanceof Error) {
      this.cause = this.cause ?? fromError?.cause;
      this.code = this.code ?? fromError?.code;
      this.message = this.message ?? fromError?.message;
      this.name = this.name ?? fromError?.name;
      this.stack = fromError?.stack;
    }
  }
}

function convertErrorToJSON(forError?: Error): {code: string, message: string, name: string, stack: string} {
  let houndError: (HoundError | undefined);

  if (forError instanceof HoundError) {
    houndError = forError;
  }
  else if (forError !== undefined) {
    houndError = new HoundError(forError?.message, forError.name, forError.code, forError);
  }

  return {
    code: houndError?.code ?? 'Unknown Code',
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    message: houndError?.message.replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ') ?? 'Unknown Message',
    name: houndError?.name ?? 'Unknown Name',
    stack: houndError?.stack ?? 'Unknown Stack',
  };
}

export {
  ERROR_CODES, HoundError, convertErrorToJSON,
};
