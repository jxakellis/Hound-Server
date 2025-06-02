const mappingLogActionTypeLogUnitTypeColumns = `
mlatlut.mappingId,
mlatlut.logActionTypeId,
mlatlut.logUnitTypeId
`;

type MappingLogActionTypeLogUnitTypeRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    mappingId: number
    logActionTypeId: number
    logUnitTypeId: number
};

export {
  type MappingLogActionTypeLogUnitTypeRow,
  mappingLogActionTypeLogUnitTypeColumns,
};
