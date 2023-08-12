// Steps out of GitHub repo directory until in parent directory, then looks for file that indicates the server should be production
// /server/ -> ../ -> /main/ -> ../ -> /Node/ -> ../ -> /Hound-Server/ -> ../ -> /PARENT_DIR/
const IS_PRODUCTION_DATABASE = require('fs').existsSync(`${__dirname}/../../../../productionIndicator.txt`);

const SERVER = {
  // True if we are using the production database that houses real users, false if we are launching a development server for testing
  IS_PRODUCTION_DATABASE,
  // HTTPS uses port 443
  SERVER_PORT: 443,
  // True if we are using a development database, false if we are using a production database as we don't want lots of console logs from users (note: serverLogger logs regardless of this settings)
  CONSOLE_LOGGING_ENABLED: !IS_PRODUCTION_DATABASE,
  // App versions of the iOS Hound app that work properly with the server.
  // A version would be depreciated if an endpoint path is changed or endpoint data return format is changed
  // Allows for testing of new versions in development but leave production alone
  COMPATIBLE_IOS_APP_VERSIONS: ['3.0.0'],
  // How often the database connections are tested as being connected and excess previousRequests/previousResponses are deleted (in milliseconds)
  DATABASE_MAINTENANCE_INTERVAL: (1000 * 60 * 5),
  // How long the database connection can stay idle before being killed (in seconds)
  DATABASE_CONNECTION_WAIT_TIMEOUT: (60 * 60 * 1),
  // How many entries to keep in the previousRequests and previousResponses tables
  DATABASE_NUMBER_OF_PREVIOUS_REQUESTS_RESPONSES: 10000000,
  APP_BUNDLE_ID: 'com.example.Pupotty',
};

const LIMIT = {
  /// If we have too many jobs scheduled at once, it could slow performance.
  // Additionally, there could be uncaught jobs getting duplicated that won't get noticed with a high limit
  NUMBER_OF_SCHEDULED_JOBS_ALLOWED: 1000000,
  // A user can have <= the number listed below of logs for each dog. E.g. if 100,000 then the family can have <= 100,000 logs per dog
  // IMPORTANT: If you modify this value, change the value on Hound app's DogConstant
  NUMBER_OF_LOGS_PER_DOG: 50000,
  // A user can have <= the number listed below of reminders for each dog. E.g. if 10 then the family can have <= 10 reminders per dog
  // IMPORTANT: If you modify this value, change the value on Hound app's DogConstant
  NUMBER_OF_REMINDERS_PER_DOG: 10,
  // A family can have <= the number listed below of dogs. E.g. if 10 then the family can have <= 10 dogs
  // IMPORTANT: If you modify this value, change the value on Hound app's DogConstant
  NUMBER_OF_DOGS_PER_FAMILY: 10,
};

const NOTIFICATION = {
  LENGTH: {
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
  CATEGORY: {
    USER: {
      // user terminated the Hound app (disabling their loud notifications)
      TERMINATE: 'NOTIFICATION_CATEGORY_USER_TERMINATE',
      // user was kicked from their family
      KICKED: 'NOTIFICATION_CATEGORY_USER_KICKED',
    },
    // for notifications about a family's status
    FAMILY: {
      // Family member joined the family
      JOIN: 'NOTIFICATION_CATEGORY_FAMILY_JOIN',
      // Family member left the family
      LEAVE: 'NOTIFICATION_CATEGORY_FAMILY_LEAVE',
      // Family member locked the family
      LOCK: 'NOTIFICATION_CATEGORY_FAMILY_LOCK',
    },
    // for notifications about logs
    LOG: {
      /*
       NOTE: If you add more categories for this section, you will have to update the rest of the Hound code to recognize this.
       Components specific rely upon checking for LOG.CREATED exactly instead of checking for LOG.*
      */
      // Family member created a log of care
      CREATED: 'NOTIFICATION_CATEGORY_LOG_CREATED',
    },
    // for notifications about reminder's alarms
    REMINDER: {
      /*
       NOTE: If you add more categories for this section, you will have to update the rest of the Hound code to recognize this.
       Components specific rely upon checking for REMINDER.ALARM exactly instead of checking for REMINDER.*
      */
      ALARM: 'NOTIFICATION_CATEGORY_REMINDER_ALARM',
    },
  },
};

const DEFAULT_SUBSCRIPTION_PRODUCT_ID = 'com.jonathanxakellis.hound.default';
const DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS = 1;

const SUBSCRIPTION = {
  DEFAULT_SUBSCRIPTION_PRODUCT_ID,
  DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS,
  // The in app purchase offerings for subscriptions (default indicates free / no payment)
  SUBSCRIPTIONS: [
    {
      productId: DEFAULT_SUBSCRIPTION_PRODUCT_ID,
      numberOfFamilyMembers: DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
    {
      productId: 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly',
      numberOfFamilyMembers: 2,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
    {
      productId: 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly',
      numberOfFamilyMembers: 4,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
    {
      productId: 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly',
      numberOfFamilyMembers: 6,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
    {
      productId: 'com.jonathanxakellis.hound.sixfamilymembers.onemonth',
      numberOfFamilyMembers: 6,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
    {
      productId: 'com.jonathanxakellis.hound.sixfamilymembers.sixmonth',
      numberOfFamilyMembers: 6,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
    {
      productId: 'com.jonathanxakellis.hound.sixfamilymembers.oneyear',
      numberOfFamilyMembers: 6,
      numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    },
  ],
};

const ERROR = {
  GENERAL: {
    APP_VERSION_OUTDATED: 'ER_GENERAL_APP_VERSION_OUTDATED',
    ENVIRONMENT_INVALID: 'ER_GENERAL_ENVIRONMENT_INVALID',
    PARSE_FORM_DATA_FAILED: 'ER_GENERAL_PARSE_FORM_DATA_FAILED',
    PARSE_JSON_FAILED: 'ER_GENERAL_PARSE_JSON_FAILED',
    POOL_CONNECTION_FAILED: 'ER_GENERAL_POOL_CONNECTION_FAILED',
    POOL_TRANSACTION_FAILED: 'ER_GENERAL_POOL_TRANSACTION_FAILED',
    APPLE_SERVER_FAILED: 'ER_GENERAL_APPLE_SERVER_FAILED',
    APPLE_SIGNEDPAYLOAD_NO_KEY_MATCH: 'ER_GENERAL_APPLE_NO_KEY_MATCH',
  },
  VALUE: {
    MISSING: 'ER_VALUE_MISSING',
    INVALID: 'ER_VALUE_INVALID',
  },
  PERMISSION: {
    NO: {
      USER: 'ER_PERMISSION_NO_USER',
      FAMILY: 'ER_PERMISSION_NO_FAMILY',
      DOG: 'ER_PERMISSION_NO_DOG',
      LOG: 'ER_PERMISSION_NO_LOG',
      REMINDER: 'ER_PERMISSION_NO_REMINDER',
    },
    INVALID: {
      FAMILY: 'ER_PERMISSION_INVALID_FAMILY',
    },
  },
  FAMILY: {
    LIMIT: {
      FAMILY_MEMBER_TOO_LOW: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_TOO_LOW',
      DOG_TOO_LOW: 'ER_FAMILY_LIMIT_DOG_TOO_LOW',
      LOG_TOO_LOW: 'ER_FAMILY_LIMIT_LOG_TOO_LOW',
      REMINDER_TOO_LOW: 'ER_FAMILY_LIMIT_REMINDER_TOO_LOW',
      FAMILY_MEMBER_EXCEEDED: 'ER_FAMILY_LIMIT_FAMILY_MEMBER_EXCEEDED',
    },
    DELETED: {
      DOG: 'ER_FAMILY_DELETED_DOG',
      LOG: 'ER_FAMILY_DELETED_LOG',
      REMINDER: 'ER_FAMILY_DELETED_REMINDER',
    },
    JOIN: {
      FAMILY_CODE_INVALID: 'ER_FAMILY_JOIN_FAMILY_CODE_INVALID',
      FAMILY_LOCKED: 'ER_FAMILY_JOIN_FAMILY_LOCKED',
      IN_FAMILY_ALREADY: 'ER_FAMILY_JOIN_IN_FAMILY_ALREADY',
    },
    LEAVE: {
      SUBSCRIPTION_ACTIVE: 'ER_FAMILY_LEAVE_SUBSCRIPTION_ACTIVE',
      STILL_FAMILY_MEMBERS: 'ER_FAMILY_LEAVE_STILL_FAMILY_MEMBERS',
    },
  },
};

global.CONSTANT = {
  SERVER,
  LIMIT,
  NOTIFICATION,
  SUBSCRIPTION,
  ERROR,
};

// Freeze every object so nothing can be mutated as constants are final
Object.freeze(global.CONSTANT);
