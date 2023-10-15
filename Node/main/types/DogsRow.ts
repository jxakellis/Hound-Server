import { DogLogsRow } from './DogLogsRow';
import { DogRemindersRow } from './DogRemindersRow';

const prefix = 'd.';

const dogsColumnsWithDPrefix = `
d.dogId,
d.familyId,
d.dogName,
d.dogLastModified,
d.dogIsDeleted
`;

const dogsColumnsWithoutPrefix = dogsColumnsWithDPrefix.replace(prefix, '');

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
  DogsRow,
  dogsColumnsWithDPrefix,
  dogsColumnsWithoutPrefix,
};
