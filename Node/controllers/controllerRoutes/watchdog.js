const { getDatabaseStatusForWatchdog } = require('../getFor/getForWatchdog');

async function getWatchdog(req, res) {
  try {
    await getDatabaseStatusForWatchdog(req.databaseConnection);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

module.exports = {
  getWatchdog,
};
