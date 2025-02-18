import { type DogLogsRow } from './DogLogsRow.js';
import { type DogRemindersRow } from './DogRemindersRow.js';

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
    logs?: DogLogsRow[]
    reminders?: DogRemindersRow[]
};

type NotYetCreatedDogsRow = Omit<DogsRow, 'dogId' | 'dogIsDeleted' | 'dogLastModified'>;
type NotYetUpdatedDogsRow = Omit<DogsRow, 'dogIsDeleted' | 'dogLastModified'>;

export {
  type DogsRow,
  type NotYetCreatedDogsRow,
  type NotYetUpdatedDogsRow,
  dogsColumns,
};
