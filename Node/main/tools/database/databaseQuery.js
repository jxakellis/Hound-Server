const { ValidationError, DatabaseError } = require('../general/errors');
const { formatArray, formatString } = require('../format/formatObject');
const { areAllDefined } = require('../validate/validateDefined');
const { databaseConnectionForGeneral } = require('./createDatabaseConnections');
const { poolLogger } = require('../logging/loggers');

/**
 * Queries the database with the given sqlString. If a databaseConnection is provided, then uses that databaseConnection, otherwise uses the databaseConnectionForGeneral
 */
const databaseQuery = (forDatabaseConnection, forSQLString, forSQLVariables) => new Promise((resolve, reject) => {
  const databaseConnection = areAllDefined(forDatabaseConnection) ? forDatabaseConnection : databaseConnectionForGeneral;
  if (areAllDefined(databaseConnection) === false) {
    reject(new ValidationError('databaseConnection missing for databaseQuery', global.CONSTANT.ERROR.VALUE.MISSING));
  }

  // Remove all newlines, remove all carriage returns, and make all >1 length spaces into 1 length spaces
  const SQLString = formatString(forSQLString).replace('/\r?\n|\r/g', '').replace(/\s+/g, ' ');

  if (areAllDefined(SQLString) === false) {
    reject(new ValidationError('SQLString missing for databaseQuery', global.CONSTANT.ERROR.VALUE.MISSING));
  }
  poolLogger.debug(`\ndatabaseQuery w/o variables: ${SQLString}\n`);

  const SQLVariables = areAllDefined(forSQLVariables) ? formatArray(forSQLVariables) : [];

  databaseConnection.query(
    SQLString,
    SQLVariables,
    (error, result) => {
      poolLogger.debug(`\ndatabaseQuery finished variables: ${result} \n ${error}\n`);
      if (error) {
        // error when trying to do query to database
        reject(new DatabaseError(error.message, error.code));
      }
      else {
        // database queried successfully
        resolve(result);
      }
    },
  );
});

module.exports = { databaseQuery };
