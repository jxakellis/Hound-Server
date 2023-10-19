import express from 'express';

import {
  getReminders, createReminder, updateReminder, deleteReminder,
} from '../controllers/controllerRoutes/reminders.js';
import { validateParamsReminderId, validateBodyReminderId } from '../main/tools/validate/validateId.js';

const remindersRouter = express.Router({ mergeParams: true });

// No need to validate body for get ( no body exists )
// No need to validate body for create ( there are no passed reminders )
// Validate body for put at specific route
// Validate body for delete at specific route

// validation that params are formatted correctly and have adequate permissions
remindersRouter.param('reminderId', validateParamsReminderId);

// gets all reminders
remindersRouter.get('/', getReminders);
// no body

// gets specific reminder
remindersRouter.get('/:reminderId', getReminders);
// no body

// create reminder(s)
remindersRouter.post('/', createReminder);
/* BODY:
Single: { reminderInfo }
Multiple: { reminders: [reminderInfo1, reminderInfo2...] }
*/

// update reminder(s)
remindersRouter.put('/', validateBodyReminderId, updateReminder);
// remindersRouter.put('/:reminderId', updateReminder);
/* BODY:
Single: { reminderInfo }
Multiple: { reminders: [reminderInfo1, reminderInfo2...] }
*/

// delete reminder(s)
remindersRouter.delete('/', validateBodyReminderId, deleteReminder);
// remindersRouter.delete('/:reminderId', deleteReminder);
/* BODY:
Single: { reminderId }
Multiple: { reminders: [reminderId1, reminderId2...] }
*/

export { remindersRouter };
