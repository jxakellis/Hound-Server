import express from 'express';

import {
  getReminders, createReminder, updateReminder, deleteReminder,
} from '../../../../../controllers/controllerRoutes/app/user/family/dogs/reminders.js';
import { validateReminderUUID } from '../../../../../main/tools/validate/validateDogRelatedId.js';

const remindersRouter = express.Router({ mergeParams: true });

remindersRouter.use(['/'], validateReminderUUID);

remindersRouter.get(['/'], getReminders);
remindersRouter.patch(['/'], getReminders);

remindersRouter.post(['/'], createReminder);

remindersRouter.put(['/'], updateReminder);

remindersRouter.delete(['/'], deleteReminder);

export { remindersRouter };
