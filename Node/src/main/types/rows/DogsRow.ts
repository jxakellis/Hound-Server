import { type DogLogsRow } from './DogLogsRow.js';
import { type DogRemindersRow } from './DogRemindersRow.js';
import type { DogTriggersRow } from './DogTriggersRow.js';

const dogsColumns = `
d.dogId,
d.dogUUID,
d.familyId,
d.dogName,
d.dogCreated,
d.dogCreatedBy,
d.dogLastModified,
d.dogLastModifiedBy,
d.dogIsDeleted
`;

type DogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    dogId: number
    dogUUID: string
    familyId: string
    dogName: string
    dogCreated: Date
    dogCreatedBy: string
    dogLastModified?: Date
    dogLastModifiedBy?: string
    dogIsDeleted: number
};

type DogsRowWithRemindersLogsTriggers = DogsRow & {
  // added w/ separate queries
  dogLogs: DogLogsRow[]
  dogReminders: DogRemindersRow[]
  dogTriggers: DogTriggersRow[]
}

type NotYetCreatedDogsRow = Omit<DogsRow, 'dogId' | 'dogIsDeleted' | 'dogCreated' | 'dogLastModified' | 'dogLastModifiedBy'>;
type NotYetUpdatedDogsRow = Omit<DogsRow, 'dogIsDeleted' | 'dogCreated' | 'dogCreatedBy' | 'dogLastModified'>;

export {
  type DogsRow,
  type DogsRowWithRemindersLogsTriggers,
  type NotYetCreatedDogsRow,
  type NotYetUpdatedDogsRow,
  dogsColumns,
};
