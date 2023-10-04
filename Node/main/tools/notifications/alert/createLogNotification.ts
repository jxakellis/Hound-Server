const { alertLogger } from '../../logging/loggers';
const { databaseConnectionForGeneral } from '../../database/createDatabaseConnections';
const { areAllDefined } from '../../validate/validateDefined';

const { logServerError } from '../../logging/logServerError';
const { getDogForDogId } from '../../../../controllers/getFor/getForDogs';
const { getUserFirstNameLastNameForUserId } from '../../../../controllers/getFor/getForUser';
const { sendNotificationForFamilyExcludingUser } from '../apn/sendNotification';
const { formatIntoAbreviatedFullName } from '../../format/formatName';
const { formatLogAction } from '../../format/formatName';

/**
 * Sends an alert to all of the family members that one of them has logged something.
 */
async function createLogNotification(userId, familyId, dogId, logAction, logCustomActionName) {
  try {
    alertLogger.debug(`createLogNotification ${userId}, ${familyId}, ${dogId}, ${logAction}, ${logCustomActionName}`);

    // make sure all params are defined
    if (areAllDefined(userId, familyId, dogId, logAction) === false) {
      return;
    }

    const promises = [
      getUserFirstNameLastNameForUserId(databaseConnectionForGeneral, userId),
      getDogForDogId(databaseConnectionForGeneral, dogId, null, null, null),
    ];
    const [user, dog] = await Promise.all(promises);

    // check to see if we were able to retrieve the properties of the user who logged the event and the dog that the log was under
    if (areAllDefined(user, dog) === false) {
      return;
    }

    if (areAllDefined(user.userFirstName, user.userLastName, dog.dogName) === false) {
      return;
    }

    const abreviatedFullName = formatIntoAbreviatedFullName(user.userFirstName, user.userLastName);
    const formattedLogAction = formatLogAction(logAction, logCustomActionName);

    // now we can construct the messages
    // Maximum possible length of message: 3 (raw) + 32 (variable) = 35 ( > ALERT_TITLE_LIMIT )
    const alertTitle = `📝 ${dog.dogName}`;

    // Maximum possible length of message: 8 (raw) + 34 (variable) + 32 (variable) = 74 ( <= ALERT_BODY_LIMIT )
    const alertBody = `${abreviatedFullName} logged ${formattedLogAction}`;

    // we now have the messages and can send our APN
    sendNotificationForFamilyExcludingUser(userId, familyId, global.CONSTANT.NOTIFICATION.CATEGORY.LOG.CREATED, alertTitle, alertBody, {});
  }
  catch (error) {
    logServerError('createLogNotification', error);
  }
}

export { createLogNotification };
