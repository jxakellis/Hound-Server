enum ErrorType {
  General = 'General',
  Database = 'Database',
  Validation = 'Validation',
  ExternalServer = 'External Server',
}

class HoundError extends Error {
  type: ErrorType;

  constructor(message: string, type: ErrorType, code?: string) {
    super(message);
    this.message = message;
    this.code = code;
    this.type = type;
  }
}

function convertErrorToJSON(error?: Error): {message: string, code: string, type: string} {
  if (error instanceof HoundError) {
    return {
      // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
      message: error?.message.replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ') ?? 'Unknown Message',
      code: error?.code ?? 'Unknown Code',
      type: error?.type ?? 'Unknown Type',
    };
  }

  return {
    // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
    message: error?.message.replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ') ?? 'Unknown Message',
    code: error?.code ?? 'Unknown Code',
    type: error?.name ?? 'Unknown Type',
  };
}

export {
  ErrorType, HoundError, convertErrorToJSON,
};
