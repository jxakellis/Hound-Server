import { alertLogger } from '../../../logging/loggers';
import { databaseConnectionForGeneral } from '../../../database/createDatabaseConnections';

import { logServerError } from '../../../logging/logServerError';
import { getDogForDogId } from '../../../../controllers/getFor/getForDogs';
import { getPublicUser } from '../../../../controllers/getFor/getForUser';
import { sendNotificationForFamilyExcludingUser } from '../apn/sendNotification';
import { formatIntoName, formatLogAction } from '../../../format/formatName';
import { NOTIFICATION } from '../../../server/globalConstants';
import { HoundError } from '../../../server/globalErrors';

/**
 * Sends an alert to all of the family members that one of them has logged something.
 */
async function createLogNotification(userId: string, familyId: string, dogId: number, logAction: string, logCustomActionName?: string): Promise<void> {
  try {
    alertLogger.debug(`createLogNotification ${userId}, ${familyId}, ${dogId}, ${logAction}, ${logCustomActionName}`);

    const user = await getPublicUser(databaseConnectionForGeneral, userId);
    const dog = await getDogForDogId(databaseConnectionForGeneral, dogId, false, false, undefined);

    const abreviatedFullName = formatIntoName(true, user?.userFirstName, user?.userLastName);
    const formattedLogAction = formatLogAction(logAction, logCustomActionName);

    // now we can construct the messages
    // Maximum possible length of message: 3 (raw) + 32 (variable) = 35 ( > ALERT_TITLE_LIMIT )
    const alertTitle = `📝 ${dog?.dogName}`;

    // Maximum possible length of message: 8 (raw) + 34 (variable) + 32 (variable) = 74 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abreviatedFullName} logged ${formattedLogAction}`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, NOTIFICATION.CATEGORY.LOG.CREATED, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError(
      new HoundError(
        'createLogNotification',
        'createLogNotification',
        undefined,
        error,
      ),
    );
  }
}

export { createLogNotification };
