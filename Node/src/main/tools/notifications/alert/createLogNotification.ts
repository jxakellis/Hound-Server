import { alertLogger } from '../../../logging/loggers.js';

import { logServerError } from '../../../logging/logServerError.js';
import { getDogForDogUUID } from '../../../../controllers/get/getDogs.js';
import { getPublicUser } from '../../../../controllers/get/getUser.js';
import { sendNotificationForAllFamilyExcludingUser } from '../apn/sendNotification.js';
import { formatFirstLastName } from '../../../format/formatFirstLastName.js';
import { NOTIFICATION } from '../../../server/globalConstants.js';
import { HoundError } from '../../../server/globalErrors.js';
import { getAllLogActionTypes } from '../../../../controllers/get/types/getLogActionType.js';
import { convertActionTypeToFinalReadable } from '../../../../main/format/formatActionType.js';
import type { Queryable } from '../../../../main/types/Queryable.js';

/**
 * Sends an alert to all of the family members that one of them has logged something.
 */
async function createLogNotification(databaseConnection: Queryable, userId: string, familyId: string, dogUUID: string, logActionTypeId: number, logCustomActionName?: string): Promise<void> {
  try {
    alertLogger.debug(`createLogNotification ${userId}, ${familyId}, ${dogUUID}, ${logActionTypeId}, ${logCustomActionName}`);
    const [user, notDeletedDog, logActionTypes] = await Promise.all([
      getPublicUser(databaseConnection, userId),
      getDogForDogUUID(databaseConnection, dogUUID, false, false, undefined),
      getAllLogActionTypes(databaseConnection),
    ]);

    const logActionType = logActionTypes.find((lat) => lat.logActionTypeId === logActionTypeId);

    if (logActionType === undefined) {
      throw new Error(`logActionType ${logActionTypeId} not found`);
    }

    const abbreviatedFullName = formatFirstLastName(true, user?.userFirstName, user?.userLastName);
    const formattedLogAction = convertActionTypeToFinalReadable(logActionType, true, logCustomActionName);

    // now we can construct the messages
    // Maximum possible length of message: 3 (raw) + 32 (variable) = 35 ( > ALERT_TITLE_LIMIT )
    const alertTitle = `📝 ${notDeletedDog?.dogName}`;

    // Maximum possible length of message: 8 (raw) + 34 (variable) + 32 (variable) = 74 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abbreviatedFullName} logged ${formattedLogAction}`;

    // we now have the messages and can send our APN
    sendNotificationForAllFamilyExcludingUser(userId, familyId, NOTIFICATION.CATEGORY.LOG.CREATED, alertTitle, alertBody, {});
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
