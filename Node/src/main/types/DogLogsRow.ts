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

// TODO add cross compatibility for logActionTypeId. Primarily check for this when get/create/update dog logs but also allow backwards compatibiltiy for logAction raw string

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
