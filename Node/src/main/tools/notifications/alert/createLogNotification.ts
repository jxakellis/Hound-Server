import { alertLogger } from '../../../logging/loggers.js';
import { DatabasePools, getPoolConnection } from '../../../database/databaseConnections.js';

import { logServerError } from '../../../logging/logServerError.js';
import { getDogForDogUUID } from '../../../../controllers/getFor/getForDogs.js';
import { getPublicUser } from '../../../../controllers/getFor/getForUser.js';
import { sendNotificationForFamilyExcludingUser } from '../apn/sendNotification.js';
import { formatFirstLastName } from '../../../format/formatFirstLastName.js';
import { formatLogActionToReadableValue } from '../../../format/formatLogAction.js';
import { NOTIFICATION } from '../../../server/globalConstants.js';
import { HoundError } from '../../../server/globalErrors.js';

/**
 * Sends an alert to all of the family members that one of them has logged something.
 */
async function createLogNotification(userId: string, familyId: string, dogUUID: string, logAction: string, logCustomActionName?: string): Promise<void> {
  try {
    alertLogger.debug(`createLogNotification ${userId}, ${familyId}, ${dogUUID}, ${logAction}, ${logCustomActionName}`);
    // This pool connection is obtained manually here. Therefore we must also release it manually.
    // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
    const generalPoolConnectionA = await getPoolConnection(DatabasePools.general);
    const user = await getPublicUser(generalPoolConnectionA, userId).finally(() => {
      generalPoolConnectionA.release();
    });

    // This pool connection is obtained manually here. Therefore we must also release it manually.
    // Therefore, we need to be careful in our usage of this pool connection, as if errors get thrown, then it could escape the block and be unused
    const generalPoolConnectionB = await getPoolConnection(DatabasePools.general);
    const notDeletedDog = await getDogForDogUUID(generalPoolConnectionB, dogUUID, false, false, undefined).finally(() => {
      generalPoolConnectionB.release();
    });

    const abbreviatedFullName = formatFirstLastName(true, user?.userFirstName, user?.userLastName);
    const formattedLogAction = formatLogActionToReadableValue(true, logAction, logCustomActionName);

    // now we can construct the messages
    // Maximum possible length of message: 3 (raw) + 32 (variable) = 35 ( > ALERT_TITLE_LIMIT )
    const alertTitle = `📝 ${notDeletedDog?.dogName}`;

    // Maximum possible length of message: 8 (raw) + 34 (variable) + 32 (variable) = 74 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abbreviatedFullName} logged ${formattedLogAction}`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, NOTIFICATION.CATEGORY.LOG.CREATED, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createLogNotification',
        createLogNotification,
        undefined,
        error,
      ),
    );
  }
}

export { createLogNotification };
