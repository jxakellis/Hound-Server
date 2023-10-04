import express from 'express';
const { getDatabaseStatusForWatchdog } from '../getFor/getForWatchdog';

async function getWatchdog(req: express.Request, res: express.Response) {
  try {
    await getDatabaseStatusForWatchdog(req.databaseConnection);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

export {
  getWatchdog,
};
