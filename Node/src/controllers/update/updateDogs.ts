import type { NotYetUpdatedDogsRow } from '../../main/types/rows/DogsRow.js';
import { type Queryable, databaseQuery } from '../../main/database/databaseQuery.js';
import { formatKnownString } from '../../main/format/formatObject.js';

/**
 *  Queries the database to update a dog. If the query is successful, then returns
 *  If a problem is encountered, creates and throws custom error
 */
async function updateDogForDog(databaseConnection: Queryable, dog: NotYetUpdatedDogsRow): Promise<void> {
  await databaseQuery(
    databaseConnection,
    `UPDATE dogs
    SET dogName = ?, dogLastModified = CURRENT_TIMESTAMP()
    WHERE dogUUID = ?`,
    [
      formatKnownString(dog.dogName, 32),
      dog.dogUUID,
    ],
  );
}

export { updateDogForDog };
