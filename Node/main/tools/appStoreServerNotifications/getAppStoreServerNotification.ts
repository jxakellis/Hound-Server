import { Queryable, databaseQuery } from '../../database/databaseQuery';
import { AppStoreServerNotificationsRow, appStoreServerNotificationsColumnsWithASSNPrefix } from '../../types/AppStoreServerNotificationsRow';

// TODO NOW find all uses of [] to index and use .safeIndex to get possible undefined

/**
 * Attempts to find the App Store Server Notification associated with the notificationUUID provided
 * @param {*} databaseConnection
 * @param {*} notificationUUID unique identifier for ASSN
 * @returns If found, returns stored ASSN. Otherwise, returns null.
 */
async function getAppStoreServerNotification(databaseConnection: Queryable, notificationUUID: string): Promise<AppStoreServerNotificationsRow | undefined> {
  const notifications = await databaseQuery<AppStoreServerNotificationsRow[]>(
    databaseConnection,
    `SELECT
    ${appStoreServerNotificationsColumnsWithASSNPrefix}
    FROM appStoreServerNotifications assn
    WHERE notificationUUID = ? 
    LIMIT 1`,
    [notificationUUID],
  );

  return notifications.safeIndex(0);
}

export { getAppStoreServerNotification };
