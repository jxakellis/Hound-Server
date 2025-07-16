import type { DogTriggerLogReactionRow, NotYetCreatedDogTriggerLogReactionRow } from './DogTriggerLogReactionRow.js';
import type { DogTriggerReminderResultRow, NotYetCreatedDogTriggerReminderResultRow } from './DogTriggerReminderResultRow.js';

const dogTriggersColumns = `
dt.triggerId,
dt.triggerUUID,
dt.dogUUID,
dt.triggerType,
dt.triggerTimeDelay,
dt.triggerFixedTimeType,
dt.triggerFixedTimeTypeAmount,
dt.triggerFixedTimeUTCHour,
dt.triggerFixedTimeUTCMinute,
dt.triggerLastModified,
dt.triggerIsDeleted
`;

type DogTriggersRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    triggerId: number
    triggerUUID: string
    dogUUID: string
    triggerLogReactions: DogTriggerLogReactionRow[]
    triggerReminderResult: DogTriggerReminderResultRow
    triggerType: string
    triggerTimeDelay: number
    triggerFixedTimeType: string
    triggerFixedTimeTypeAmount: number
    triggerFixedTimeUTCHour: number
    triggerFixedTimeUTCMinute: number
    triggerLastModified: Date
    triggerIsDeleted: number
};

type NotYetCreatedDogTriggersRow = Omit<DogTriggersRow, 'triggerId' | 'triggerIsDeleted' | 'triggerLastModified' | 'triggerLogReactions' | 'triggerReminderResult'> & {
  triggerLogReactions: NotYetCreatedDogTriggerLogReactionRow[];
  triggerReminderResult: NotYetCreatedDogTriggerReminderResultRow;
};

type NotYetUpdatedDogTriggersRow = Omit<DogTriggersRow, 'triggerIsDeleted' | 'triggerLastModified' | 'triggerLogReactions' | 'triggerReminderResult'> & {
  triggerLogReactions: NotYetCreatedDogTriggerLogReactionRow[];
  triggerReminderResult: NotYetCreatedDogTriggerReminderResultRow;
};

export {
  type DogTriggersRow,
  type NotYetCreatedDogTriggersRow,
  type NotYetUpdatedDogTriggersRow,
  dogTriggersColumns,
};
