import express from 'express';

import {
  getReminders, createReminder, updateReminder, deleteReminder,
} from '../controllers/controllerRoutes/reminders.js';
import { validateReminderId } from '../main/tools/validate/validateDogRelatedId.js';

const remindersRouter = express.Router({ mergeParams: true });

// TODO FUTURE depreciate :reminderId, last used <= 3.0.0
remindersRouter.use(['/:reminderId', '/'], validateReminderId);

remindersRouter.get(['/:reminderId', '/'], getReminders);
remindersRouter.patch(['/:reminderId', '/'], getReminders);

remindersRouter.post(['/'], createReminder);

remindersRouter.put(['/:reminderId', '/'], updateReminder);

remindersRouter.delete(['/:reminderId', '/'], deleteReminder);

export { remindersRouter };
