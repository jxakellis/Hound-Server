type ResponseBodyType = {
    message: string
    code: string
    name: string
    stack: string
    requestId?: number
    responseId?: number
} | {
    result: unknown
    requestId?: number
    responseId?: number
};

export { ResponseBodyType };
