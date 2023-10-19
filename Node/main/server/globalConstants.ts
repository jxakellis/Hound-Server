// Steps out of GitHub repo directory until in parent directory, then looks for file that indicates the server should be production
// /server/ -> ../ -> /main/ -> ../ -> /Node/ -> ../ -> /Hound-Server/ -> ../ -> /PARENT_DIR/
import * as fs from 'fs';
import { TransactionsRow } from '../types/TransactionsRow';

const IS_PRODUCTION_DATABASE = fs.existsSync(`${__dirname}/../../../../productionIndicator.txt`);

const SERVER = {
  // True if we are using the production database that houses real users, false if we are launching a development server for testing
  IS_PRODUCTION_DATABASE,
  ENVIRONMENT: IS_PRODUCTION_DATABASE ? 'Production' : 'Sandbox',
  // HTTPS uses port 443
  SERVER_PORT: 443,
  // True if we are using a development database, false if we are using a production database as we don't want lots of console logs from users (note: serverLogger logs regardless of this settings)
  CONSOLE_LOGGING_ENABLED: !IS_PRODUCTION_DATABASE,
  // App versions of the iOS Hound app that work properly with the server.
  // A version would be depreciated if an endpoint path is changed or endpoint data return format is changed
  // Allows for testing of new versions in development but leave production alone
  COMPATIBLE_IOS_APP_VERSIONS: ['3.0.0', '3.0.1'],
  // How often the database connections are tested as being connected and excess previousRequests/previousResponses are deleted (in milliseconds)
  DATABASE_MAINTENANCE_INTERVAL: (1000 * 60 * 5),
  // How long the database connection can stay idle before being killed (in seconds)
  DATABASE_CONNECTION_WAIT_TIMEOUT: (60 * 60 * 3),
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

const DEFAULT_SUBSCRIPTION_USER_ID = '0123456789012345678901234567890123456789012345678901234567890123';
const DEFAULT_SUBSCRIPTION_PURCHASE_DATE = new Date('0000-01-01T00:00:00+0000');
const DEFAULT_SUBSCRIPTION_EXPIRES_DATE = new Date('3000-01-01T00:00:00+0000');
const DEFAULT_SUBSCRIPTION_PRODUCT_ID = 'com.jonathanxakellis.hound.default';
const DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS = 1;

const SUBSCRIPTIONS: TransactionsRow[] = [
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: DEFAULT_SUBSCRIPTION_PRODUCT_ID,
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: DEFAULT_SUBSCRIPTION_PRODUCT_ID,
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly',
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: 2,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: 'com.jonathanxakellis.hound.twofamilymemberstwodogs.monthly',
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly',
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: 4,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: 'com.jonathanxakellis.hound.fourfamilymembersfourdogs.monthly',
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly',
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: 6,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: 'com.jonathanxakellis.hound.sixfamilymemberssixdogs.monthly',
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: 'com.jonathanxakellis.hound.sixfamilymembers.onemonth',
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: 6,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: 'com.jonathanxakellis.hound.sixfamilymembers.onemonth',
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: 'com.jonathanxakellis.hound.sixfamilymembers.sixmonth',
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: 6,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: 'com.jonathanxakellis.hound.sixfamilymembers.sixmonth',
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
  {
    userId: DEFAULT_SUBSCRIPTION_USER_ID,
    transactionId: -1,
    productId: 'com.jonathanxakellis.hound.sixfamilymembers.oneyear',
    purchaseDate: DEFAULT_SUBSCRIPTION_PURCHASE_DATE,
    expiresDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    expirationDate: DEFAULT_SUBSCRIPTION_EXPIRES_DATE,
    numberOfFamilyMembers: 6,
    numberOfDogs: LIMIT.NUMBER_OF_DOGS_PER_FAMILY,
    autoRenewStatus: 1,
    isAutoRenewing: 1,
    autoRenewProductId: 'com.jonathanxakellis.hound.sixfamilymembers.oneyear',
    revocationReason: undefined,
    offerIdentifier: undefined,
  },
];

const SUBSCRIPTION = {
  DEFAULT_SUBSCRIPTION_PRODUCT_ID,
  DEFAULT_SUBSCRIPTION_NUMBER_OF_FAMILY_MEMBERS,
  // The in app purchase offerings for subscriptions (default indicates free / no payment)
  SUBSCRIPTIONS,
};

export {
  SERVER, LIMIT, NOTIFICATION, SUBSCRIPTION,
};
