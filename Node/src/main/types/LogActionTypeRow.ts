const logActionTypeColumns = `
lat.logActionTypeId,
lat.internalValue,
lat.readableValue,
lat.emoji,
lat.sortOrder
`;

type LogActionTypeRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logActionTypeId: number
    internalValue: string
    readableValue: string
    emoji: string
    sortOrder: number
};

export {
  type LogActionTypeRow,
  logActionTypeColumns,
};
