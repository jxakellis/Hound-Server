import express from 'express';

import {
  getReminders, createReminder, updateReminder, deleteReminder,
} from '../controllers/controllerRoutes/reminders.js';
import { validateReminderId } from '../main/tools/validate/validateDogRelatedId.js';

const remindersRouter = express.Router({ mergeParams: true });

remindersRouter.use(['/'], validateReminderId);

remindersRouter.get(['/'], getReminders);
remindersRouter.patch(['/'], getReminders);

remindersRouter.post(['/'], createReminder);

remindersRouter.put(['/'], updateReminder);

remindersRouter.delete(['/'], deleteReminder);

export { remindersRouter };
