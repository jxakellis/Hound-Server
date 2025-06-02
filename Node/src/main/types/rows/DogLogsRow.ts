const dogLogsColumns = `
dl.logId,
dl.logUUID,
dl.dogUUID,
dl.userId,
dl.logStartDate,
dl.logEndDate,
dl.logNote,
dl.logActionTypeId,
dl.logCustomActionName,
dl.logUnit,
dl.logNumberOfLogUnits,
dl.logLastModified,
dl.logIsDeleted
`;

// TODO NOW make logUnit row into depreciated
// 1. modify column in db to change val
// 2. still select its value here
// 3. in the controller route, map the logUnit passed by legacy users to the logUnitTypeId (if no logUnitTypeId)
// 4. in create/update route, retrieve the logUnit readable value using logUnitTypeId, then insert into depreciated column

type DogLogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    logId: number
    logUUID: string
    dogUUID: string
    userId: string
    logStartDate: Date
    logEndDate?: Date
    logNote: string
    logActionTypeId: number
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
