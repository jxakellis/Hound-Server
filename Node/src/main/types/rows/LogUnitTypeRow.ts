const logUnitTypeColumns = `
lut.logUnitTypeId,
lut.unitSymbol,
lut.readableValue,
lut.isImperial,
lut.isMetric,
lut.isUnitMass,
lut.isUnitVolume,
lut.isUnitLength,
lut.sortOrder
`;

type LogUnitTypeRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logUnitTypeId: number
    unitSymbol: string
    readableValue: string
    isImperial: number
    isMetric: number
    isUnitMass: number
    isUnitVolume: number
    isUnitLength: number
    sortOrder: number
};

export {
  type LogUnitTypeRow,
  logUnitTypeColumns,
};
