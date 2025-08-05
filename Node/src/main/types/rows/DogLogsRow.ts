const dogLogsColumns = `
dl.logId,
dl.logUUID,
dl.dogUUID,
dl.logStartDate,
dl.logEndDate,
dl.logNote,
dl.logActionTypeId,
dl.logCustomActionName,
dl.logUnitTypeId,
dl.logNumberOfLogUnits,
dl.logCreatedByReminderUUID,
dl.logCreated,
dl.logCreatedBy,
dl.logLastModified,
dl.logLastModifiedBy,
dl.logIsDeleted
`;

type DogLogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logId: number
    logUUID: string
    dogUUID: string
    logStartDate: Date
    logEndDate?: Date
    logNote: string
    logActionTypeId: number
    logCustomActionName: string
    logUnitTypeId?: number,
    logNumberOfLogUnits?: number
    logCreatedByReminderUUID?: string
    logCreated: Date
    logCreatedBy?: string
    logLastModified?: Date
    logLastModifiedBy?: string
    logIsDeleted: number
};

type NotYetCreatedDogLogsRow = Omit<DogLogsRow,
'logId' | 'logIsDeleted' | 'logCreated' | 'logLastModified' | 'logLastModifiedBy'>;
type NotYetUpdatedDogLogsRow = Omit<DogLogsRow, 'logIsDeleted' | 'logCreated' | 'logCreatedBy' | 'logLastModified'>;

export {
  type DogLogsRow,
  type NotYetCreatedDogLogsRow,
  type NotYetUpdatedDogLogsRow,
  dogLogsColumns,
};
