const ERROR_CODES = {
  GENERAL: {
    APP_VERSION_OUTDATED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_APP_VERSION_OUTDATED' },
    ENVIRONMENT_INVALID: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_ENVIRONMENT_INVALID' },
    PARSE_FORM_DATA_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_PARSE_FORM_DATA_FAILED' },
    PARSE_JSON_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_PARSE_JSON_FAILED' },
    POOL_CONNECTION_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_POOL_CONNECTION_FAILED' },
    POOL_TRANSACTION_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_POOL_TRANSACTION_FAILED' },
    APPLE_SERVER_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_APPLE_SERVER_FAILED' },
    APPLE_SIGNED_PAYLOAD_NO_KEY_MATCH: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_APPLE_SIGNED_PAYLOAD_NO_KEY_MATCH' },
  },
  VALUE: {
    MISSING: { ERROR_CODE_FROM_ERROR_CODES: 'ER_VALUE_MISSING' },
    INVALID: { ERROR_CODE_FROM_ERROR_CODES: 'ER_VALUE_INVALID' },
  },
  PERMISSION: {
    NO: {
      USER: { ERROR_CODE_FROM_ERROR_CODES: 'ER_PERMISSION_NO_USER' },
      FAMILY: { ERROR_CODE_FROM_ERROR_CODES: 'ER_PERMISSION_NO_FAMILY' },
      DOG: { ERROR_CODE_FROM_ERROR_CODES: 'ER_PERMISSION_NO_DOG' },
      LOG: { ERROR_CODE_FROM_ERROR_CODES: 'ER_PERMISSION_NO_LOG' },
      REMINDER: { ERROR_CODE_FROM_ERROR_CODES: 'ER_PERMISSION_NO_REMINDER' },
    },
    INVALID: {
      FAMILY: { ERROR_CODE_FROM_ERROR_CODES: 'ER_PERMISSION_INVALID_FAMILY' },
    },
  },
  FAMILY: {
    LIMIT: {
      FAMILY_MEMBER_TOO_LOW: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_TOO_LOW' },
      DOG_TOO_LOW: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LIMIT_DOG_TOO_LOW' },
      LOG_TOO_LOW: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LIMIT_LOG_TOO_LOW' },
      REMINDER_TOO_LOW: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LIMIT_REMINDER_TOO_LOW' },
      FAMILY_MEMBER_EXCEEDED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_EXCEEDED' },
    },
    DELETED: {
      DOG: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_DELETED_DOG' },
      LOG: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_DELETED_LOG' },
      REMINDER: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_DELETED_REMINDER' },
    },
    JOIN: {
      FAMILY_CODE_INVALID: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_JOIN_FAMILY_CODE_INVALID' },
      FAMILY_LOCKED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_JOIN_FAMILY_LOCKED' },
      IN_FAMILY_ALREADY: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_JOIN_IN_FAMILY_ALREADY' },
    },
    LEAVE: {
      SUBSCRIPTION_ACTIVE: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LEAVE_SUBSCRIPTION_ACTIVE' },
      STILL_FAMILY_MEMBERS: { ERROR_CODE_FROM_ERROR_CODES: 'ER_FAMILY_LEAVE_STILL_FAMILY_MEMBERS' },
    },
  },
};

class HoundError extends Error {
  sourceFunctions: (string[] | undefined);

  debugInfo: (string | undefined);

  constructor(forCustomMessage?: string, forSourceFunction?: { name: string }, forCode?: { ERROR_CODE_FROM_ERROR_CODES: string }, fromError?: unknown, forDebugInfo?: string) {
    // We want the message to be the customMessage (if supplied), otherwise try to extract it fromError, otherwise result to default
    let customMessage = forCustomMessage;

    if (fromError !== undefined && fromError !== null && fromError instanceof Error) {
      if (customMessage === undefined || customMessage === null) {
        customMessage = fromError.message;
      }
      else {
        customMessage += `->APPENDING NEXT MESSAGE->${fromError.message}`;
      }
    }

    customMessage = customMessage ?? 'Unknown Message';

    super(customMessage);

    this.houndDeclarationCode = forCode?.ERROR_CODE_FROM_ERROR_CODES;

    this.sourceFunctions = this.sourceFunctions ?? [];
    if (forSourceFunction !== undefined && forSourceFunction !== null) {
      this.sourceFunctions.push(forSourceFunction?.name);
    }

    customMessage = customMessage ?? 'Unknown Message';

    // Attempt to initialize this.debugInfo to forDebugInfo
    if (forDebugInfo !== undefined && forDebugInfo !== null) {
      if (this.debugInfo === undefined || this.debugInfo === null) {
        this.debugInfo = forDebugInfo;
      }
      else {
        this.debugInfo += `->APPENDING NEXT DEBUG->${forDebugInfo}`;
      }
    }
    // debugInfo can be null, but thats fine

    // Attempt to set other parameters, using the parameters first, then fromError seconds if no value found
    if (fromError !== undefined && fromError !== null && fromError instanceof Error) {
      // code and sourceFunction are set by us. Therefore, our manual values take priority
      this.houndDeclarationCode = this.houndDeclarationCode ?? fromError.houndDeclarationCode;
      this.sourceFunctions.push(fromError.name);
      // cause, name, and stack aren't set by us. Therefore, override their values with fromError
      this.cause = fromError.cause;
      this.name = fromError.name;
      this.stack = fromError.stack;
    }
  }

  toJSON(): {code: string, message: string, sourceFunctions: string, name: string, stack: string, debugInfo?: string} {
    return {
      sourceFunctions: this.sourceFunctions?.toString() ?? 'Unknown Source Functions', // , 100),
      code: this.houndDeclarationCode ?? 'Unknown Code',
      // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
      message: this.message.replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ') ?? 'Unknown Message',
      name: this.name ?? 'Unknown Name',
      stack: this.stack ?? 'Unknown Stack',
      debugInfo: this.debugInfo,
    };
  }
}

export {
  ERROR_CODES, HoundError,
};
