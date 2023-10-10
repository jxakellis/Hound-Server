type StatusResultRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    Variable_name: string;
    Value: string;
};

export { StatusResultRow };
