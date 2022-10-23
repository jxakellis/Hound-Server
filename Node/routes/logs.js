const express = require('express');

const logsRouter = express.Router({ mergeParams: true });

const {
  getLogs, createLog, updateLog, deleteLog,
} = require('../controllers/controllerRoutes/logs');
const { validateLogId } = require('../main/tools/format/validateId');

// validation that params are formatted correctly and have adequate permissions
logsRouter.param('logId', validateLogId);

// gets all logs
logsRouter.get('/', getLogs);
// no body

// gets specific logs
logsRouter.get('/:logId', getLogs);
// no body

// create log
logsRouter.post('/', createLog);
/* BODY:
Single: { logInfo }
*/

// updates log
logsRouter.put('/:logId', updateLog);
/* BODY:
Single: { logInfo }
*/

// deletes log
logsRouter.delete('/:logId', deleteLog);
// no body

module.exports = { logsRouter };
