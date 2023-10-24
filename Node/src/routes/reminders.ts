import express from 'express';

import {
  getReminders, createReminder, updateReminder, deleteReminder,
} from '../controllers/controllerRoutes/reminders.js';
import { validateReminderId } from '../main/tools/validate/validateId.js';

const remindersRouter = express.Router({ mergeParams: true });

remindersRouter.use(validateReminderId);

remindersRouter.get(['/:reminderId', '/'], getReminders);

remindersRouter.post('/', createReminder);

remindersRouter.put('/', validateReminderId, updateReminder);

remindersRouter.delete('/', validateReminderId, deleteReminder);

export { remindersRouter };
