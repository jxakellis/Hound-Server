const mappingLogActionTypeReminderActionTypeColumns = `
mlatrat.mappingId,
mlatrat.logActionTypeId,
mlatrat.reminderActionTypeId
`;

type MappingLogActionTypeReminderActionTypeRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    mappingId: number
    logActionTypeId: number
    reminderActionTypeId: number
};

export {
  type MappingLogActionTypeReminderActionTypeRow,
  mappingLogActionTypeReminderActionTypeColumns,
};
