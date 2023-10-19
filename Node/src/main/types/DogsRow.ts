import { type DogLogsRow } from './DogLogsRow';
import { type DogRemindersRow } from './DogRemindersRow';

const dogsColumns = `
d.dogId,
d.familyId,
d.dogName,
d.dogLastModified,
d.dogIsDeleted
`;

type DogsRow = {
    // NOTE: database booleans (tinyint(1)) are returned as 0 or 1 numbers, not booleans. therefore, we have to use number instead of boolean
    dogId: number
    familyId: string
    dogName: string
    dogLastModified: Date
    dogIsDeleted: number
    logs?: DogLogsRow[]
    reminders?: DogRemindersRow[]
};

export {
  type DogsRow,
  dogsColumns,
};
