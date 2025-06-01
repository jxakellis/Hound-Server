import type { LogActionTypeRow } from './rows/LogActionTypeRow.js';
import type { MappingLogActionTypeReminderActionTypeRow } from './rows/MappingLogActionTypeReminderActionTypeRow.js';
import type { ReminderActionTypeRow } from './rows/ReminderActionTypeRow.js';

type GlobalTypes = {
    logActionType: LogActionTypeRow[]
    reminderActionType: ReminderActionTypeRow[]
    mappingLogActionTypeReminderActionType: MappingLogActionTypeReminderActionTypeRow[]
};

export { type GlobalTypes };
