import { type ResultSetHeader, type RowDataPacket } from 'mysql2';
import { poolLogger } from '../logging/loggers';
import { HoundError } from '../server/globalErrors';
import { type Queryable } from '../types/Queryable';

// Define the "impossible" type to force callers to specify a type parameter for the function.
type MustSpecifyType<T> = T & { __mustSpecifyType__: void };
type SQLVariableType = (string | number | boolean | Date | null | undefined);

/**
 * Queries the database with the given sqlString. If a databaseConnection is provided, then uses that databaseConnection, otherwise uses the databaseConnectionForGeneral.
 * The generic type <T> is mandatory to specify when calling this function to ensure the type of the returned data is known.
 */
const databaseQuery = <T>(
  databaseConnection: Queryable,
  forSQLString: string,
  forSQLVariables: SQLVariableType[] = [],
): Promise<MustSpecifyType<T>> => {
  // Remove all newlines, remove all ca rriage returns, and make all >1 length spaces into 1 length spaces
  const SQLString = forSQLString.replace(/\r?\n|\r/g, '').replace(/\s+/g, ' ');

  const SQLVariables = forSQLVariables.map((variable) => {
    if (variable === undefined) {
      return null;
    }
    return variable;
  });

  poolLogger.debug(`databaseQuery w/o variables: ${SQLString}`);

  return new Promise<MustSpecifyType<T>>((resolve, reject) => {
    databaseConnection.query(
      SQLString,
      SQLVariables,
      (error, result) => {
        if (error) {
          // error when trying to do query to database
          reject(new HoundError(undefined, databaseQuery, undefined, error));
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
  type Queryable, type ResultSetHeader, type RowDataPacket, databaseQuery,
};
