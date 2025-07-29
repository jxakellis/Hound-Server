import { type DogLogsRow } from './DogLogsRow.js';
import { type DogRemindersRow } from './DogRemindersRow.js';
import type { DogTriggersRow } from './DogTriggersRow.js';

const dogsColumns = `
d.dogId,
d.dogUUID,
d.familyId,
d.dogName,
d.dogLastModified,
d.dogIsDeleted
`;

type DogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    dogId: number
    dogUUID: string
    familyId: string
    dogName: string
    dogLastModified: Date
    dogIsDeleted: number
};

type DogsRowWithRemindersLogsTriggers = DogsRow & {
   // TODO FUTURE DEPRECIATE <= 4.0.0, we use dogLogs & dogReminders now, drop the short logs/reminders
  logs: DogLogsRow[]
  reminders: DogRemindersRow[]
  dogLogs: DogLogsRow[]
  dogReminders: DogRemindersRow[]
  dogTriggers: DogTriggersRow[]
}

type NotYetCreatedDogsRow = Omit<DogsRow, 'dogId' | 'dogIsDeleted' | 'dogLastModified'>;
type NotYetUpdatedDogsRow = Omit<DogsRow, 'dogIsDeleted' | 'dogLastModified'>;

export {
  type DogsRow,
  type DogsRowWithRemindersLogsTriggers,
  type NotYetCreatedDogsRow,
  type NotYetUpdatedDogsRow,
  dogsColumns,
};
