const { getDatabaseStatusForWatchdog } = require('../getFor/getForWatchdog');

async function getWatchdog(req, res) {
  try {
    await getDatabaseStatusForWatchdog(req.databaseConnection);
    return res.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

module.exports = {
  getWatchdog,
};
