import type { LogActionTypeRow } from './rows/LogActionTypeRow.js';
import type { LogUnitTypeRow } from './rows/LogUnitTypeRow.js';
import type { MappingLogActionTypeLogUnitTypeRow } from './rows/MappingLogActionTypeLogUnitTypeRow.js';
import type { MappingLogActionTypeReminderActionTypeRow } from './rows/MappingLogActionTypeReminderActionTypeRow.js';
import type { ReminderActionTypeRow } from './rows/ReminderActionTypeRow.js';

type GlobalTypes = {
    logActionType: LogActionTypeRow[]
    reminderActionType: ReminderActionTypeRow[]
    mappingLogActionTypeReminderActionType: MappingLogActionTypeReminderActionTypeRow[]
    logUnitType: LogUnitTypeRow[]
    mappingLogActionTypeLogUnitType: MappingLogActionTypeLogUnitTypeRow[]
};

export { type GlobalTypes };
