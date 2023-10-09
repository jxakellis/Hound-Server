import { DogLogsRow } from './DogLogsRow';
import { DogRemindersRow } from './DogRemindersRow';

const prefix = 'd.';

const dogsColumnsWithDPrefix = `
d.dogId,
d.dogName,
d.dogLastModified,
d.dogIsDeleted
`;

const dogsColumnsWithoutPrefix = dogsColumnsWithDPrefix.replace(prefix, '');

type DogsRow = {
    dogId: number
    dogName: string
    dogLastModified: Date
    dogIsDeleted: boolean
    logs?: DogLogsRow[]
    reminders?: DogRemindersRow[]
};

export {
  DogsRow,
  dogsColumnsWithDPrefix,
  dogsColumnsWithoutPrefix,
};
