const dogLogsColumns = `
dl.logId,
dl.dogId,
dl.userId,
dl.logDate,
dl.logNote,
dl.logAction,
dl.logCustomActionName,
dl.logLastModified,
dl.logIsDeleted
`;

type DogLogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logId: number
    dogId: number
    userId: string
    logDate: Date
    logNote: string
    logAction: string
    logCustomActionName: string
    logLastModified: Date
    logIsDeleted: number
};

export {
  type DogLogsRow,
  dogLogsColumns,
};
