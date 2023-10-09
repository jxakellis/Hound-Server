import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { poolLogger } from '../tools/logging/loggers';
import { HoundError, ErrorType } from '../server/globalErrors';
import { Queryable } from '../types/Queryable';

// Define the "impossible" type to force callers to specify a type parameter for the function.
type MustSpecifyType<T> = T & { __mustSpecifyType__: void };

/**
 * Queries the database with the given sqlString. If a databaseConnection is provided, then uses that databaseConnection, otherwise uses the databaseConnectionForGeneral.
 * The generic type <T> is mandatory to specify when calling this function to ensure the type of the returned data is known.
 */
const databaseQuery = <T>(
  databaseConnection: Queryable,
  forSQLString: string,
  SQLVariables: unknown[] = [],
): Promise<MustSpecifyType<T>> => {
  // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
  const SQLString = forSQLString.replace(/\r?\n|\r/g, '').replace(/\s+/g, ' ');

  poolLogger.debug(`databaseQuery w/o variables: ${SQLString}`);

  return new Promise<MustSpecifyType<T>>((resolve, reject) => {
    databaseConnection.query(
      SQLString,
      SQLVariables,
      (error, result) => {
        if (error) {
          // error when trying to do query to database
          reject(new HoundError(error.message, ErrorType.Database, error.code));
        }
        else {
          // database queried successfully
          resolve(result as MustSpecifyType<T>); // Cast to our "impossible" type
        }
      },
    );
  });
};

export {
  Queryable, ResultSetHeader, RowDataPacket, databaseQuery,
};
