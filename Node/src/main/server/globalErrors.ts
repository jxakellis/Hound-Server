import { formatKnownString } from '../format/formatObject.js';

const ERROR_CODES = {
  GENERAL: {
    APP_VERSION_OUTDATED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_APP_VERSION_OUTDATED' },
    ENVIRONMENT_INVALID: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_ENVIRONMENT_INVALID' },
    PARSE_FORM_DATA_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_PARSE_FORM_DATA_FAILED' },
    PARSE_JSON_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_PARSE_JSON_FAILED' },
    POOL_CONNECTION_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_POOL_CONNECTION_FAILED' },
    POOL_TRANSACTION_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_POOL_TRANSACTION_FAILED' },
    APPLE_SERVER_FAILED: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_APPLE_SERVER_FAILED' },
    APPLE_SIGNEDPAYLOAD_NO_KEY_MATCH: { ERROR_CODE_FROM_ERROR_CODES: 'ER_GENERAL_APPLE_NO_KEY_MATCH' },
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
  sourceFunction: (string | undefined);

  constructor(forCustomMessage?: string, forSourceFunction?: { name: string }, forCode?: { ERROR_CODE_FROM_ERROR_CODES: string }, fromError?: unknown) {
    // We want the message to be the customMessage (if supplied), otherwise try to extract it fromError, otherwise result to default
    let customMessage = forCustomMessage;

    if (fromError !== undefined && fromError !== null && fromError instanceof Error) {
      if (customMessage === undefined || customMessage === null) {
        customMessage = fromError.message;
      }
      else {
        customMessage += (fromError.message);
      }
    }

    customMessage = customMessage ?? 'Unknown Message';

    super(customMessage);

    this.houndDeclarationCode = forCode?.ERROR_CODE_FROM_ERROR_CODES;
    this.sourceFunction = forSourceFunction?.name;
    // Attempt to set other parameters, using the parameters first, then fromError seconds if no value found
    if (fromError !== undefined && fromError !== null && fromError instanceof Error) {
      // code and sourceFunction are set by us. Therefore, our manual values take priority
      this.houndDeclarationCode = this.houndDeclarationCode ?? fromError.houndDeclarationCode;
      this.sourceFunction = this.sourceFunction ?? fromError.name;
      // cause, name, and stack aren't set by us. Therefore, override their values with fromError
      this.cause = fromError.cause;
      this.name = fromError.name;
      this.stack = fromError.stack;
    }
  }
}

function convertErrorToJSON(houndError?: HoundError): {code: string, message: string, sourceFunction: string, name: string, stack: string} {
  return {
    sourceFunction: formatKnownString(houndError?.sourceFunction ?? 'Unknown Source Function'), // , 100),
    code: formatKnownString(houndError?.houndDeclarationCode ?? 'Unknown Code'), // , 500),
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    message: formatKnownString(houndError?.message.replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ') ?? 'Unknown Message'), // , 500),
    name: formatKnownString(houndError?.name ?? 'Unknown Name'), // , 500),
    stack: formatKnownString(houndError?.stack ?? 'Unknown Stack'), // , 2500),
  };
}

export {
  ERROR_CODES, HoundError, convertErrorToJSON,
};
