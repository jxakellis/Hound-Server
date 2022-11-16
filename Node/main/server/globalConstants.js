// Steps out of GitHub repo directory until in parent directory, then looks for file that indicates the server should be production
// /server/ -> ../ -> /main/ -> ../ -> /Node/ -> ../ -> /Hound-Server/ -> ../ -> /PARENT_DIR/
const IS_PRODUCTION_DATABASE = require('fs').existsSync(`${__dirname}/../../../../productionIndicator.txt`);

const server = {
  // True if we are using the production database that houses real users, false if we are launching a development server for testing
  IS_PRODUCTION_DATABASE,
  // HTTPS uses port 443
  SERVER_PORT: 443,
  // True if we are using a development database, false if we are using a production database as we don't want lots of console logs from users (note: serverLogger logs regardless of this settings)
  CONSOLE_LOGGING_ENABLED: !IS_PRODUCTION_DATABASE,
  // App versions of the iOS Hound app that work properly with the server.
  // A version would be depreciated if an endpoint path is changed or endpoint data return format is changed
  // Allows for testing of new versions in development but leave production alone
  COMPATIBLE_IOS_APP_VERSIONS: IS_PRODUCTION_DATABASE ? ['2.0.0', '2.0.1'] : ['2.0.0', '2.0.1'],
  // How often the database connections are tested as being connected and excess previousRequests/previousResponses are deleted (in milliseconds)
  DATABASE_MAINTENANCE_INTERVAL: IS_PRODUCTION_DATABASE ? (1000 * 60 * 15) : (1000 * 60 * 5),
  // How long the database connection can stay idle before being killed (in seconds)
  DATABASE_CONNECTION_WAIT_TIMEOUT: IS_PRODUCTION_DATABASE ? (60 * 60 * 3) : (60 * 60 * 1),
  // How many entries to keep in the previousRequests and previousResponses tables
  DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES: IS_PRODUCTION_DATABASE ? 10000000 : 10000,
};

const limit = {
  /// If we have too many jobs scheduled at once, it could slow performance.
  // Additionally, there could be uncaught jobs getting duplicated that won't get noticed with a high limit
  NUMBER_OF_SCHEDULED_JOBS_ALLOWED: 1000000,
  // A user can have <= the number listed below of logs for each dog. E.g. if 100,000 then the family can have <= 100,000 logs per dog
  NUMBER_OF_LOGS_PER_DOG: 50000,
  // A user can have <= the number listed below of reminders for each dog. E.g. if 10 then the family can have <= 10 reminders per dog
  NUMBER_OF_REMINDERS_PER_DOG: 10,
};

const notification = {
  length: {
    /*
      Tested different title & body length APN to see how much of the notification was displayed

      180 title & 0 body:     31 char title & 0 body
      0 title & 180 body:     0 char title & 128 char body
      180 title & 180 body:   31 char title & 128 char body
      29 title & 123 body:    29 char title & 123 char body
      30 title & 123 body:    30 char title & 123 char body
      29 title & 124 body:    29 char title & 124 char body
      30 title & 124 body:    30 char title & 124 char body
      31 title & 128 body:    31 char title & 128 char body
      32 title & 128 body:    32 char title & 128 char body

      NOTE: If the notification changes from showing 'now' next to it and shows '1m ago' (or similar),
      this increased text length (indicating time since notification arrived) can cause the title to be shortened (the time text expands)
      */
    ALERT_TITLE_LIMIT: 32,
    ALERT_BODY_LIMIT: 128,
  },
  category: {
    // for notifications about reminder's alarms
    reminder: {
      PRIMARY: 'NOTIFICATION_CATEGORY_REMINDER_PRIMARY',
    },
    // for notifications about logs
    log: {
      // Family member created a log of care
      CREATED: 'NOTIFICATION_CATEGORY_LOG_CREATED',
    },
    // for notifications about a family's status
    family: {
      // Family member joined the family
      JOIN: 'NOTIFICATION_CATEGORY_FAMILY_JOIN',
      // Family member left the family
      LEAVE: 'NOTIFICATION_CATEGORY_FAMILY_LEAVE',
      // Family member paused reminders for the family
      PAUSE: 'NOTIFICATION_CATEGORY_FAMILY_PAUSE',
      // Family member locked the family
      LOCK: 'NOTIFICATION_CATEGORY_FAMILY_LOCK',
    },
    user: {
      // user terminated the Hound app (disabling their loud notifications)
      TERMINATE: 'NOTIFICATION_CATEGORY_USER_TERMINATE',
      // user was kicked from their family
      KICKED: 'NOTIFICATION_CATEGORY_USER_KICKED',
    },
    general: {
      // unknown future notifications
      GENERAL: 'NOTIFICATION_CATEGORY_GENERAL_GENERAL',
    },
  },
};

const DEFAULT_SUBSCRIPTION_PRODUCT_ID = 'com.jonathanxakellis.hound.default';
const DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS = 1;
const DEFAULT_SUBSCRIPTION_NUMBER_OF_DOGS = 2;

const subscription = {
  DEFAULT_SUBSCRIPTION_PRODUCT_ID,
  DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS,
  DEFAULT_SUBSCRIPTION_NUMBER_OF_DOGS,
  // How many milliseconds the expiration date of a sandbox subscription should be extended
  SANDBOX_EXPIRATION_DATE_EXTENSION: 1000 * 60 * 60 * 24 * 365,
  // The in app purchase offerings for subscriptions (default indicates free / no payment)
  SUBSCRIPTIONS: [
    {
      productId: DEFAULT_SUBSCRIPTION_PRODUCT_ID,
      numberOfFamilyMembers: DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS,
      numberOfDogs: DEFAULT_SUBSCRIPTION_NUMBER_OF_DOGS,
    },
    {
      productId: 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly',
      numberOfFamilyMembers: 2,
      numberOfDogs: 2,
    },
    {
      productId: 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly',
      numberOfFamilyMembers: 4,
      numberOfDogs: 4,
    },
    {
      productId: 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly',
      numberOfFamilyMembers: 6,
      numberOfDogs: 6,
    },
    {
      productId: 'com.jonathanxakellis.hound.tenfamilymemberstendogs.monthly',
      numberOfFamilyMembers: 10,
      numberOfDogs: 10,
    },
  ],
};

const error = {
/*
Category: ER_GENERAL                        PREVIOUS NAME (pre 7/9/2022)
ER_GENERAL_APP_VERSION_OUTDATED               (ER_APP_VERSION_OUTDATED)
ER_GENERAL_PARSE_FORM_DATA_FAILED           (ER_NO_PARSE_FORM_DATA)
ER_GENERAL_PARSE_JSON_FAILED                (ER_NO_PARSE_JSON)
ER_GENERAL_POOL_CONNECTION_FAILED           (ER_NO_POOL_CONNECTION)
ER_GENERAL_POOL_TRANSACTION_FAILED          (ER_NO_POOL_TRANSACTION)
ER_GENERAL_APPLE_SERVER_FAILED              (ER_APPLE_SERVER)

Category: ER_VALUE
ER_VALUE_MISSING                            (ER_VALUES_MISSING, ER_NO_VALUES_PROVIDED, ER_FAMILY_CODE_INVALID)
ER_VALUE_INVALID                            (ER_VALUES_INVALID, ER_NOT_FOUND, ER_ID_INVALID)

Category: ER_FAMILY
Sub-Category: LIMIT
ER_FAMILY_LIMIT_FAMILY_MEMBER_TOO_LOW       (ER_FAMILY_MEMBER_LIMIT_TOO_LOW)
ER_FAMILY_LIMIT_DOG_TOO_LOW                 (ER_DOG_LIMIT_TOO_LOW)
ER_FAMILY_LIMIT_LOG_TOO_LOW                 (ER_LOGS_LIMIT_TOO_LOW)
ER_FAMILY_LIMIT_REMINDER_TOO_LOW            (ER_REMINDER_LIMIT_TOO_LOW)
ER_FAMILY_LIMIT_FAMILY_MEMBER_EXCEEDED      (ER_FAMILY_MEMBER_LIMIT_EXCEEDED)
ER_FAMILY_LIMIT_DOG_EXCEEDED                (ER_DOG_LIMIT_EXCEEDED)

Sub-Category: JOIN
ER_FAMILY_JOIN_IN_FAMILY_ALREADY            (ER_FAMILY_ALREADY)
ER_FAMILY_JOIN_FAMILY_CODE_INVALID          (ER_FAMILY_NOT_FOUND)
ER_FAMILY_JOIN_FAMILY_LOCKED                (ER_FAMILY_LOCKED)

Sub-Category: PERMISSION
ER_FAMILY_PERMISSION_INVALID                (ER_FAMILY_PERMISSION_INVALID)
*/

  general: {
    APP_VERSION_OUTDATED: 'ER_GENERAL_APP_VERSION_OUTDATED',
    ENVIRONMENT_INVALID: 'ER_GENERAL_ENVIRONMENT_INVALID',
    PARSE_FORM_DATA_FAILED: 'ER_GENERAL_PARSE_FORM_DATA_FAILED',
    PARSE_JSON_FAILED: 'ER_GENERAL_PARSE_JSON_FAILED',
    POOL_CONNECTION_FAILED: 'ER_GENERAL_POOL_CONNECTION_FAILED',
    POOL_TRANSACTION_FAILED: 'ER_GENERAL_POOL_TRANSACTION_FAILED',
    APPLE_SERVER_FAILED: 'ER_GENERAL_APPLE_SERVER_FAILED',
  },
  value: {
    MISSING: 'ER_VALUE_MISSING',
    INVALID: 'ER_VALUE_INVALID',
    NOT_UPDATE: 'ER_VALUE_NOT_UPDATED',
  },
  family: {
    limit: {
      FAMILY_MEMBER_TOO_LOW: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_TOO_LOW',
      DOG_TOO_LOW: 'ER_FAMILY_LIMIT_DOG_TOO_LOW',
      LOG_TOO_LOW: 'ER_FAMILY_LIMIT_LOG_TOO_LOW',
      REMINDER_TOO_LOW: 'ER_FAMILY_LIMIT_REMINDER_TOO_LOW',
      FAMILY_MEMBER_EXCEEDED: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_EXCEEDED',
      DOG_EXCEEDED: 'ER_FAMILY_LIMIT_DOG_EXCEEDED',
    },
    join: {
      FAMILY_CODE_INVALID: 'ER_FAMILY_JOIN_FAMILY_CODE_INVALID',
      FAMILY_LOCKED: 'ER_FAMILY_JOIN_FAMILY_LOCKED',
      IN_FAMILY_ALREADY: 'ER_FAMILY_JOIN_IN_FAMILY_ALREADY',
    },
    leave: {
      SUBSCRIPTION_ACTIVE: 'ER_FAMILY_LEAVE_SUBSCRIPTION_ACTIVE',
      INVALID: 'ER_FAMILY_LEAVE_INVALID',
    },
    permission: {
      INVALID: 'ER_FAMILY_PERMISSION_INVALID',
    },
  },
};

global.constant = {
  server,
  limit,
  notification,
  subscription,
  error,
};

// Freeze every object so nothing can be mutated as constants are final
Object.freeze(global.constant);
