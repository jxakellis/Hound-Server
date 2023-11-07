import { type ResultSetHeader, type RowDataPacket } from 'mysql2';
import { HoundError } from '../server/globalErrors.js';
import { type Queryable } from '../types/Queryable.js';

// Define the "impossible" type to force callers to specify a type parameter for the function.
// type MustSpecifyType<T> = T & { __mustSpecifyType__: void };
type SQLVariableType = (string | number | boolean | Date | null | undefined);

/**
 * Queries the database with the given sqlString. If a databaseConnection is provided, then uses that databaseConnection, otherwise uses the databaseConnectionForGeneral.
 * The generic type <T> is mandatory to specify when calling this function to ensure the type of the returned data is known.
 */
const databaseQuery = <T>(
  databaseConnection: Queryable,
  forSQLString: string,
  forSQLVariables: SQLVariableType[] = [],
): Promise<T> => {
  // Remove all newlines remove all carriage returns
  // Then makes all >1 length spaces into 1 length spaces
  // Then if it find a common SQL syntax error ( a comma before a closing parenthesis "  ..., reminderId, ) VALUES (...  " ), it fixes it
  const SQLString = forSQLString.replace(/\r?\n|\r/g, '').replace(/\s+/g, ' ').replace(/,\s*\)/g, ')');
  // TODO NOW if a sql query has a SELECT but no limit, add a server error, as this shouldn't happen

  const SQLVariables = forSQLVariables.map((variable) => {
    if (variable === undefined || variable === null) {
      return null;
    }
    return variable;
  });

  // poolLogger.debug(`databaseQuery w/o variables: ${SQLString}`);

  return new Promise<T>((resolve, reject) => {
    databaseConnection.query(
      SQLString,
      SQLVariables,
      (error, result) => {
        if (result === undefined || result === null) {
          // error when trying to do query to database
          reject(new HoundError(undefined, databaseQuery, undefined, error));
        }
        else {
          // database queried successfully
          resolve(result as T); // Cast to our "impossible" type
        }
      },
    );
  });
};

export {
  type Queryable, type ResultSetHeader, type RowDataPacket, databaseQuery,
};
