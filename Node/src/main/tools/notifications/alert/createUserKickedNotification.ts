import { NOTIFICATION } from '../../../server/globalConstants.js';
import { sendNotificationForUser } from '../apn/sendNotification.js';

function createUserKickedNotification(userId: string): void {
  // don't perform any checks as there are too many. we would have to make sure the user has notifications on, has loud notifications on, has an enabled/upcoming reminder, etc.
  // Maximum possible length of message: 23 (raw) + 0 (variable) = 23 (<= ALERT_TITLE_LIMIT)
  const alertTitle = '⚠️ You have been kicked';
  // Maximum possible length of message: 99 (raw) + 0 (variable) = 99 (<= ALERT_TITLE_LIMIT)
  const alertBody = 'You are no longer a part of your Hound family. However, you can still create or join another family';
  sendNotificationForUser(userId, NOTIFICATION.CATEGORY.USER.KICKED, alertTitle, alertBody, {});
}

export { createUserKickedNotification };
