type ResponseBodyType = {
    message: string;
    code: string;
    type: string;
    requestId?: number;
    responseId?: number;
} | {
    result: unknown;
    requestId?: number;
    responseId?: number;
};

export { ResponseBodyType };
