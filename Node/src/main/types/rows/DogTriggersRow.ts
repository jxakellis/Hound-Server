import type { DogTriggerActivationRow, NotYetCreatedDogTriggerActivationRow } from './DogTriggerActivationRow.js';
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
dt.triggerFixedTimeHour,
dt.triggerFixedTimeMinute,
dt.triggerManualCondition,
dt.triggerAlarmCreatedCondition,
dt.triggerCreated,
dt.triggerCreatedBy,
dt.triggerLastModified,
dt.triggerLastModifiedBy,
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
    triggerFixedTimeHour: number
    triggerFixedTimeMinute: number
    triggerManualCondition: number
    triggerAlarmCreatedCondition: number
    triggerCreated: Date
    triggerCreatedBy: string
    triggerLastModified?: Date
    triggerLastModifiedBy?: string
    triggerActivations: DogTriggerActivationRow[]
    triggerIsDeleted: number
};

type NotYetCreatedDogTriggersRow = Omit<DogTriggersRow,
'triggerId'
| 'triggerIsDeleted' | 'triggerCreated' | 'triggerLastModified' | 'triggerLastModifiedBy'
| 'triggerLogReactions' | 'triggerReminderResult' | 'triggerActivations'> & {
  triggerLogReactions: NotYetCreatedDogTriggerLogReactionRow[];
  triggerReminderResult: NotYetCreatedDogTriggerReminderResultRow;
  triggerActivations: NotYetCreatedDogTriggerActivationRow[];
};

type NotYetUpdatedDogTriggersRow = Omit<DogTriggersRow,
'triggerIsDeleted' | 'triggerCreated' | 'triggerCreatedBy' | 'triggerLastModified'
| 'triggerLogReactions' | 'triggerReminderResult' | 'triggerActivations'> & {
  triggerLogReactions: NotYetCreatedDogTriggerLogReactionRow[];
  triggerReminderResult: NotYetCreatedDogTriggerReminderResultRow;
  triggerActivations: NotYetCreatedDogTriggerActivationRow[];
};

export {
  type DogTriggersRow,
  type NotYetCreatedDogTriggersRow,
  type NotYetUpdatedDogTriggersRow,
  dogTriggersColumns,
};
