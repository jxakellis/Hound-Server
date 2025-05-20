const dogLogsColumns = `
dl.logId,
dl.logUUID,
dl.dogUUID,
dl.userId,
dl.logStartDate,
dl.logEndDate,
dl.logNote,
dl.logAction,
dl.logCustomActionName,
dl.logUnit,
dl.logNumberOfLogUnits,
dl.logLastModified,
dl.logIsDeleted
`;

// TODO make logAction into logActionTypeId column and add a FK from it to the logActionTypes table
// TODO add cross compatibility, so this change works even when internal value is still passed

type DogLogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logId: number
    logUUID: string
    dogUUID: string
    userId: string
    logStartDate: Date
    logEndDate?: Date
    logNote: string
    logAction: string
    logCustomActionName: string
    logUnit?: string
    logNumberOfLogUnits?: number
    logLastModified: Date
    logIsDeleted: number
};

type NotYetCreatedDogLogsRow = Omit<DogLogsRow, 'logId' | 'logIsDeleted' | 'logLastModified'>;
type NotYetUpdatedDogLogsRow = Omit<DogLogsRow, 'logIsDeleted' | 'logLastModified'>;

export {
  type DogLogsRow,
  type NotYetCreatedDogLogsRow,
  type NotYetUpdatedDogLogsRow,
  dogLogsColumns,
};
