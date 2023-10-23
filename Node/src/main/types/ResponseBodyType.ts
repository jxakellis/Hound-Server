type ResponseBodyType = {
    message: string
    code: string
    sourceFunctions: string
    name: string
    stack: undefined
    // THE RESPONSE SHOULD NEVER INCLUDE THE STACK. THAT IS CONFIDENTIAL
    requestId?: number
    responseId?: number
} | {
    result: unknown
    requestId?: number
    responseId?: number
};

export { type ResponseBodyType };
