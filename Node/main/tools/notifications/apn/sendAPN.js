const { apnLogger } = require('../../logging/loggers');

const { logServerError } = require('../../logging/logServerError');
const { formatString, formatBoolean, formatNumber } = require('../../format/formatObject');
const { areAllDefined } = require('../../validate/validateDefined');

const { apn, productionAPNProvider, developmentAPNProvider } = require('./apnProvider');

/**
 * Creates a notification object from the provided information
 * Sends notification object with provided token to Apple's production APN server, if .failed response then sends to development APN server
 * Takes an array of notificationTokens that identifies all the recipients of the notification
 * Takes a string that will be the title of the notification
 * Takes a string that will be the body of the notification
 */
// (token, category, sound, alertTitle, alertBody)
function sendAPN(userNotificationConfiguration, category, forAlertTitle, forAlertBody, customPayload) {
  if (areAllDefined(userNotificationConfiguration) === false) {
    return;
  }

  const userNotificationToken = formatString(userNotificationConfiguration.userNotificationToken);
  const userConfigurationIsLogNotificationEnabled = formatBoolean(userNotificationConfiguration.userConfigurationIsLogNotificationEnabled);
  const userConfigurationIsReminderNotificationEnabled = formatBoolean(userNotificationConfiguration.userConfigurationIsReminderNotificationEnabled);
  const userConfigurationNotificationSound = formatString(userNotificationConfiguration.userConfigurationNotificationSound);
  const userConfigurationIsSilentModeEnabled = formatBoolean(userNotificationConfiguration.userConfigurationIsSilentModeEnabled);
  const userConfigurationSilentModeStartUTCHour = formatNumber(userNotificationConfiguration.userConfigurationSilentModeStartUTCHour);
  const userConfigurationSilentModeEndUTCHour = formatNumber(userNotificationConfiguration.userConfigurationSilentModeEndUTCHour);
  const userConfigurationSilentModeStartUTCMinute = formatNumber(userNotificationConfiguration.userConfigurationSilentModeStartUTCMinute);
  const userConfigurationSilentModeEndUTCMinute = formatNumber(userNotificationConfiguration.userConfigurationSilentModeEndUTCMinute);
  const alertTitle = formatString(forAlertTitle, global.CONSTANT.NOTIFICATION.LENGTH.ALERT_TITLE_LIMIT);
  const alertBody = formatString(forAlertBody, global.CONSTANT.NOTIFICATION.LENGTH.ALERT_BODY_LIMIT);

  apnLogger.debug(`sendAPN ${userNotificationConfiguration}, ${category}, ${alertTitle}, ${alertBody}`);

  // userConfigurationNotificationSound optional, depends on userConfigurationIsLoudNotificationEnabled
  if (areAllDefined(
    userNotificationToken,
    userConfigurationIsLogNotificationEnabled,
    userConfigurationIsReminderNotificationEnabled,
    // userConfigurationNotificationSound,
    userConfigurationIsSilentModeEnabled,
    userConfigurationSilentModeStartUTCHour,
    userConfigurationSilentModeEndUTCHour,
    userConfigurationSilentModeStartUTCMinute,
    userConfigurationSilentModeEndUTCMinute,
    category,
    alertTitle,
    alertBody,
    customPayload,
  ) === false) {
    return;
  }

  if (category === global.CONSTANT.NOTIFICATION.CATEGORY.LOG.CREATED && userConfigurationIsLogNotificationEnabled === false) {
    return;
  }

  if (category === global.CONSTANT.NOTIFICATION.CATEGORY.REMINDER.ALARM && userConfigurationIsReminderNotificationEnabled === false) {
    return;
  }

  // Check that we aren't inside of userConfigurationSilentMode hours. If we are inside the silent mode hours, then return as we don't want to send notifications during silent mode
  if (userConfigurationIsSilentModeEnabled === true) {
    const date = new Date();
    // 2:30:45 PM -> 14.5125
    const currentUTCHour = date.getUTCHours() + (date.getUTCMinutes() / 60) + (date.getUTCSeconds() / 3600);
    const userConfigurationSilentModeStart = userConfigurationSilentModeStartUTCHour + (userConfigurationSilentModeStartUTCMinute / 60);
    const userConfigurationSilentModeEnd = userConfigurationSilentModeEndUTCHour + (userConfigurationSilentModeEndUTCMinute / 60);

    // Two ways the silent mode start and end could be setup:
    // One the same day: 8.5 -> 20.5 (silent mode during day time)
    if (userConfigurationSilentModeStart <= userConfigurationSilentModeEnd && (currentUTCHour >= userConfigurationSilentModeStart && currentUTCHour <= userConfigurationSilentModeEnd)) {
      // WOULD RETURN: silent mode start 8.5 -> 20.5 AND currentUTCHour 14.5125
      // WOULDN'T RETURN: silent mode start 8.5 -> 20.5 AND currentUTCHour 6.0
      return;
    }
    // Overlapping two days: 20.5 -> 8.5 (silent mode during night time)
    if (userConfigurationSilentModeStart >= userConfigurationSilentModeEnd && (currentUTCHour >= userConfigurationSilentModeStart || currentUTCHour <= userConfigurationSilentModeEnd)) {
      // WOULD RETURN: silent mode start 20.5 -> 8.5 AND currentUTCHour 6.0
      // WOULDN'T RETURN: silent mode start 20.5 -> 8.5 AND currentUTCHour 14.5125
      return;
    }
  }

  // the tokens array is defined and has at least one element

  const notification = new apn.Notification();

  // Properties are sent along side the payload and are defined by node-apn

  // App Bundle Id
  notification.topic = 'com.example.Pupotty';

  // A UNIX timestamp when the notification should expire. If the notification cannot be delivered to the device, APNS will retry until it expires
  // An expiry of 0 indicates that the notification expires immediately, therefore no retries will be attempted.
  notification.expiry = Math.floor(Date.now() / 1000) + 300;

  // The type of the notification. The value of this header is alert or background. Specify alert when the delivery of your notification displays an alert, plays a sound, or badges your app's icon. Specify background for silent notifications that do not interact with the user.
  // The value of this header must accurately reflect the contents of your notification's payload. If there is a mismatch, or if the header is missing on required systems, APNs may delay the delivery of the notification or drop it altogether.
  notification.pushType = 'alert';

  // Multiple notifications with same collapse identifier are displayed to the user as a single notification. The value should not exceed 64 bytes.
  // notification.collapseId = 1;

  /// Raw Payload takes after apple's definition of the APS body
  notification.rawPayload = {
    aps: {
      // The notification’s type
      // This string must correspond to the identifier of one of the UNNotificationCategory objects you register at launch time.
      category,
      // The background notification flag.
      // To perform a silent background update, specify the value 1 and don’t include the alert, badge, or sound keys in your payload.
      'content-available': 1,
      // The notification service app extension flag
      // If the value is 1, the system passes the notification to your notification service app extension before delivery.
      // Use your extension to modify the notification’s content.
      'mutable-content': 1,
      // A string that indicates the importance and delivery timing of a notification
      // The string values “passive”, “active”, “time-sensitive”, or “critical” correspond to the
      'interruption-level': global.CONSTANT.NOTIFICATION.CATEGORY.REMINDER.ALARM ? 'time-sensitive' : 'active',
      // The number to display in a badge on your app’s icon. Specify 0 to remove the current badge, if any.
      badge: 0,
      // alert Dictionary
      alert: {
        // The title of the notification. Apple Watch displays this string in the short look notification interface. Specify a string that’s quickly understood by the user.
        title: alertTitle,
        // The content of the alert message.
        body: alertBody,
      },
    },
  };

  // if there is a sound for the reminder alarm alert, then we add it to the rawPayload
  if (
    (category === global.CONSTANT.NOTIFICATION.CATEGORY.REMINDER.ALARM)
  && areAllDefined(userConfigurationNotificationSound, notification)
  && areAllDefined(notification.rawPayload)
  && areAllDefined(notification.rawPayload.aps)) {
    notification.rawPayload.aps.sound = `${userConfigurationNotificationSound}30.wav`;
  }

  // add customPayload into rawPayload
  notification.rawPayload = {
    ...customPayload,
    ...notification.rawPayload,
  };

  // aps Dictionary Keys
  // https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2943363

  // alert Dictionary Keys
  // https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2943365

  // sound Dictionary Keys
  // https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification#2990112
  sendProductionAPN(notification, userNotificationToken);
}

/**
 * Takes a constructed notification object and a token string, then attempts to send the contents to Apple's production APN server
 * If a .failed response is recieved
 */
function sendProductionAPN(notification, token) {
  if (areAllDefined(notification, token) === false) {
    return;
  }

  productionAPNProvider.send(notification, token)
    .then((response) => {
      // response.sent: Array of device tokens to which the notification was sent succesfully
      if (response.sent.length !== 0) {
        apnLogger.debug(`sendProductionAPN Response Successful: ${JSON.stringify(response.sent)}`);
        return;
      }
      // response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
      if (response.failed.length !== 0) {
        apnLogger.debug(`sendProductionAPN Response Rejected: ${JSON.stringify(response.failed)}`);
        sendDevelopmentAPN(notification, token);
      }
    })
    .catch((error) => {
      logServerError('sendProductionAPN Response', error);
    });
}

function sendDevelopmentAPN(notification, token) {
  if (areAllDefined(notification, token) === false) {
    return;
  }

  developmentAPNProvider.send(notification, token)
    .then((response) => {
      // response.sent: Array of device tokens to which the notification was sent succesfully
      if (response.sent.length !== 0) {
        apnLogger.debug(`sendDevelopmentAPN Response Successful: ${JSON.stringify(response.sent)}`);
      }
      // response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
      if (response.failed.length !== 0) {
        apnLogger.debug(`sendDevelopmentAPN Response Rejected: ${JSON.stringify(response.failed)}`);
      }
    })
    .catch((error) => {
      logServerError('sendDevelopmentAPN Response', error);
    });
}

module.exports = {
  sendAPN,
};
