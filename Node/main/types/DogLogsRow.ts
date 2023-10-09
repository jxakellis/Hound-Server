const dogLogsColumnsWithDLPrefix = `
dl.logId,
dl.userId,
dl.logDate,
dl.logNote,
dl.logAction,
dl.logCustomActionName,
dl.logLastModified,
dl.logIsDeleted
`;

const dogLogsColumnsWithoutPrefix = dogLogsColumnsWithDLPrefix.replace('dl.', '');

type DogLogsRow = {
    logId: number
    userId: string
    logDate: Date
    logNote: string
    logAction: string
    logCustomActionName: string
    logLastModified: Date
    logIsDeleted: boolean
};

export {
  DogLogsRow,
  dogLogsColumnsWithDLPrefix,
  dogLogsColumnsWithoutPrefix,
};
