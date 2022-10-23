const { getDatabaseStatusForWatchdog } = require('../getFor/getForWatchdog');

async function getWatchdog(req, res) {
  try {
    await getDatabaseStatusForWatchdog(req.databaseConnection);
    return res.sendResponseForStatusJSONError(200, { result: '' }, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusJSONError(400, undefined, error);
  }
}

module.exports = {
  getWatchdog,
};
