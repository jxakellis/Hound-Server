const dogLogsColumns = `
dl.logId,
dl.dogId,
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

type DogLogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logId: number
    dogId: number
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
