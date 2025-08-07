import { alertLogger } from '../../../logging/loggers.js';

import { logServerError } from '../../../logging/logServerError.js';
import { getLogForLogUUID } from '../../../../controllers/get/logs/getLogs.js';
import { getPublicUser } from '../../../../controllers/get/getUser.js';
import { sendNotificationForUser } from '../apn/sendNotification.js';
import { formatFirstLastName } from '../../../format/formatFirstLastName.js';
import { NOTIFICATION } from '../../../server/globalConstants.js';
import { HoundError } from '../../../server/globalErrors.js';
import { getAllLogActionTypes } from '../../../../controllers/get/types/getLogActionType.js';
import { convertActionTypeToFinalReadable } from '../../../../main/format/formatActionType.js';
import type { Queryable } from '../../../../main/types/Queryable.js';

async function createLogLikeNotification(databaseConnection: Queryable, likerUserId: string, logUUID: string): Promise<void> {
  try {
    alertLogger.debug(`createLogLikeNotification ${likerUserId}, ${logUUID}`);

    const log = await getLogForLogUUID(databaseConnection, logUUID, false);

    if (log === undefined) {
      throw new Error(`log ${logUUID} not found`);
    }

    const [liker, logActionTypes] = await Promise.all([
      getPublicUser(databaseConnection, likerUserId),
      getAllLogActionTypes(databaseConnection),
    ]);

    if (log.logCreatedBy === likerUserId) {
      return;
    }

    const logActionType = logActionTypes.find((lat) => lat.logActionTypeId === log.logActionTypeId);
    if (logActionType === undefined) {
      throw new Error(`logActionType ${log.logActionTypeId} not found`);
    }

    const abbreviatedFullName = formatFirstLastName(true, liker?.userFirstName, liker?.userLastName);
    const formattedLogAction = convertActionTypeToFinalReadable(logActionType, true, log.logCustomActionName);

    // TODO TEST make sure this notif sends
    // TODO TEXT what is a better way to word this?
    // Maximum possible length of message: 3 (raw) + 32 (variable) = 35 ( > ALERT_TITLE_LIMIT )
    const alertTitle = `❤️ ${formattedLogAction}`;

    // Maximum possible length of message: 8 (raw) + 34 (variable) = 42 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abbreviatedFullName} liked your log`;

    sendNotificationForUser(log.logCreatedBy, NOTIFICATION.CATEGORY.LOG.LIKED, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createLogLikeNotification',
        createLogLikeNotification,
        undefined,
        error,
      ),
    );
  }
}

export { createLogLikeNotification };
